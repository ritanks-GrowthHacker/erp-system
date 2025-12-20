import { NextRequest, NextResponse } from 'next/server';
import { erpDb } from '@/lib/db';
import { productCategories, products, warehouses } from '@/lib/db/schema';
import { requireErpAccess } from '@/lib/auth';
import { eq, and } from 'drizzle-orm';

// Helper function to generate unique category code
async function generateCategoryCode(erpOrganizationId: string): Promise<string> {
  const prefix = 'CAT';
  let isUnique = false;
  let code = '';
  
  while (!isUnique) {
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    code = `${prefix}-${randomPart}`;
    
    const existing = await erpDb.query.productCategories.findFirst({
      where: and(
        eq(productCategories.erpOrganizationId, erpOrganizationId),
        eq(productCategories.code, code)
      ),
    });
    
    if (!existing) {
      isUnique = true;
    }
  }
  
  return code;
}

// Helper function to generate unique product SKU
async function generateProductSKU(
  erpOrganizationId: string,
  productName: string
): Promise<string> {
  // Extract first 3-4 characters from product name
  const namePrefix = productName
    .replace(/[^a-zA-Z0-9]/g, '')
    .substring(0, 3)
    .toUpperCase();
  
  let isUnique = false;
  let sku = '';
  
  while (!isUnique) {
    // Generate 6 alphanumeric characters
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    sku = `${namePrefix}-${randomPart}`;
    
    const existing = await erpDb.query.products.findFirst({
      where: and(
        eq(products.erpOrganizationId, erpOrganizationId),
        eq(products.sku, sku)
      ),
    });
    
    if (!existing) {
      isUnique = true;
    }
  }
  
  return sku;
}

// Helper function to generate unique warehouse code
async function generateWarehouseCode(erpOrganizationId: string): Promise<string> {
  const prefix = 'WH';
  let isUnique = false;
  let code = '';
  
  while (!isUnique) {
    const randomPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    code = `${prefix}-${randomPart}`;
    
    const existing = await erpDb.query.warehouses.findFirst({
      where: and(
        eq(warehouses.erpOrganizationId, erpOrganizationId),
        eq(warehouses.code, code)
      ),
    });
    
    if (!existing) {
      isUnique = true;
    }
  }
  
  return code;
}

// POST /api/erp/inventory/generate-code
export async function POST(req: NextRequest) {
  const { user, error } = await requireErpAccess(req);
  if (error) return error;

  try {
    const body = await req.json();
    const { type, productName } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'Type is required (category, product, warehouse)' },
        { status: 400 }
      );
    }

    let code = '';

    switch (type) {
      case 'category':
        code = await generateCategoryCode(user.erpOrganizationId);
        break;
      case 'product':
        if (!productName) {
          return NextResponse.json(
            { error: 'Product name is required for SKU generation' },
            { status: 400 }
          );
        }
        code = await generateProductSKU(user.erpOrganizationId, productName);
        break;
      case 'warehouse':
        code = await generateWarehouseCode(user.erpOrganizationId);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid type. Must be category, product, or warehouse' },
          { status: 400 }
        );
    }

    return NextResponse.json({ code });
  } catch (err: any) {
    console.error('Error generating code:', err);
    return NextResponse.json(
      { error: 'Failed to generate code' },
      { status: 500 }
    );
  }
}
