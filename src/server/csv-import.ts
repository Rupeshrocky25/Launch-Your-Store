import { db, Product } from './db';

export interface RowError {
  rowNumber: number;
  field: string;
  message: string;
  raw: Record<string, string>;
}

export interface ImportPreviewResult {
  totalRows: number;
  validRowsCount: number;
  invalidRowsCount: number;
  errors: RowError[];
  validProducts: Omit<Product, 'id' | 'createdAt'>[];
}

export function generateCsvTemplate(): string {
  const headers = [
    'name',
    'sku',
    'category',
    'price',
    'compareAtPrice',
    'stock',
    'description',
    'imageUrl',
  ];
  const sampleRow1 = [
    'Handmade Brass Filter Coffee Brewer',
    'BRS-BRW-01',
    'Home & Living',
    '1499',
    '1800',
    '25',
    'Traditional South Indian brass filter coffee maker with matte buffed polish',
    'https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800',
  ];
  const sampleRow2 = [
    'Organic Chamomile Herbal Infusion',
    'TEA-CHM-100',
    'Organic & Grocery',
    '450',
    '550',
    '50',
    'Whole dried organic chamomile blossoms for peaceful evening relaxation',
    'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=800',
  ];

  return [headers.join(','), sampleRow1.join(','), sampleRow2.join(',')].join('\n');
}

export function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseAndValidateCsv(
  csvContent: string,
  storeId: string
): ImportPreviewResult {
  const lines = csvContent
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length < 2) {
    return {
      totalRows: 0,
      validRowsCount: 0,
      invalidRowsCount: 0,
      errors: [
        {
          rowNumber: 1,
          field: 'header',
          message: 'CSV file must contain a header row and at least one data row.',
          raw: {},
        },
      ],
      validProducts: [],
    };
  }

  // Parse header
  const rawHeaders = parseCsvLine(lines[0]).map(h => h.replace(/^"|"$/g, '').toLowerCase());
  
  // Normalize header mapping
  const colMap: Record<string, number> = {};
  rawHeaders.forEach((col, idx) => {
    if (col.includes('name') || col === 'title') colMap['name'] = idx;
    else if (col.includes('sku') || col.includes('code')) colMap['sku'] = idx;
    else if (col.includes('cat')) colMap['category'] = idx;
    else if (col.includes('compare') || col.includes('mrp')) colMap['compareAtPrice'] = idx;
    else if (col.includes('price')) colMap['price'] = idx;
    else if (col.includes('stock') || col.includes('qty') || col.includes('quantity')) colMap['stock'] = idx;
    else if (col.includes('desc')) colMap['description'] = idx;
    else if (col.includes('image') || col.includes('photo')) colMap['imageUrl'] = idx;
  });

  if (colMap['name'] === undefined || colMap['price'] === undefined) {
    return {
      totalRows: lines.length - 1,
      validRowsCount: 0,
      invalidRowsCount: lines.length - 1,
      errors: [
        {
          rowNumber: 1,
          field: 'headers',
          message: 'Missing mandatory column headers: "name" and "price" are required.',
          raw: {},
        },
      ],
      validProducts: [],
    };
  }

  const errors: RowError[] = [];
  const validProducts: Omit<Product, 'id' | 'createdAt'>[] = [];
  const existingSkus = new Set(db.getProducts({ storeId }).map(p => p.sku.toLowerCase()));
  const batchSkus = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const rowNum = i + 1;
    const cleanCells = parseCsvLine(lines[i]);

    const rawData: Record<string, string> = {
      name: cleanCells[colMap['name']] || '',
      sku: colMap['sku'] !== undefined ? cleanCells[colMap['sku']] || '' : '',
      category: colMap['category'] !== undefined ? cleanCells[colMap['category']] || '' : '',
      price: cleanCells[colMap['price']] || '',
      compareAtPrice: colMap['compareAtPrice'] !== undefined ? cleanCells[colMap['compareAtPrice']] || '' : '',
      stock: colMap['stock'] !== undefined ? cleanCells[colMap['stock']] || '0' : '10',
      description: colMap['description'] !== undefined ? cleanCells[colMap['description']] || '' : '',
      imageUrl: colMap['imageUrl'] !== undefined ? cleanCells[colMap['imageUrl']] || '' : '',
    };

    let rowHasError = false;

    // Validate Name
    if (!rawData.name || rawData.name.length < 2) {
      errors.push({
        rowNumber: rowNum,
        field: 'name',
        message: 'Product name is required (minimum 2 characters).',
        raw: rawData,
      });
      rowHasError = true;
    }

    // Validate Price
    const priceNum = parseFloat(rawData.price);
    if (isNaN(priceNum) || priceNum <= 0) {
      errors.push({
        rowNumber: rowNum,
        field: 'price',
        message: `Invalid price "${rawData.price}". Price must be a positive number.`,
        raw: rawData,
      });
      rowHasError = true;
    }

    // Validate Stock
    const stockNum = parseInt(rawData.stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      errors.push({
        rowNumber: rowNum,
        field: 'stock',
        message: `Invalid stock quantity "${rawData.stock}". Must be zero or a positive integer.`,
        raw: rawData,
      });
      rowHasError = true;
    }

    // Validate Compare At Price
    let comparePriceNum: number | undefined = undefined;
    if (rawData.compareAtPrice) {
      comparePriceNum = parseFloat(rawData.compareAtPrice);
      if (isNaN(comparePriceNum) || comparePriceNum < priceNum) {
        // Compare at price should be >= price
        comparePriceNum = priceNum;
      }
    }

    // Validate SKU
    const sku = (rawData.sku || `SKU-${Date.now().toString(36)}-${i}`).trim();
    if (existingSkus.has(sku.toLowerCase()) || batchSkus.has(sku.toLowerCase())) {
      errors.push({
        rowNumber: rowNum,
        field: 'sku',
        message: `Duplicate SKU code "${sku}". SKU must be unique across the store.`,
        raw: rawData,
      });
      rowHasError = true;
    } else {
      batchSkus.add(sku.toLowerCase());
    }

    if (!rowHasError) {
      const slug = rawData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      validProducts.push({
        storeId,
        name: rawData.name,
        slug: `${slug}-${sku.toLowerCase()}`,
        description: rawData.description || `${rawData.name} - high quality handcrafted collection.`,
        categoryId: 'cat-fashion',
        categoryName: rawData.category || 'General',
        price: priceNum,
        compareAtPrice: comparePriceNum,
        stock: stockNum,
        sku,
        images: rawData.imageUrl ? [rawData.imageUrl] : [],
        isFeatured: false,
        isAvailable: true,
      });
    }
  }

  return {
    totalRows: lines.length - 1,
    validRowsCount: validProducts.length,
    invalidRowsCount: errors.length,
    errors,
    validProducts,
  };
}
