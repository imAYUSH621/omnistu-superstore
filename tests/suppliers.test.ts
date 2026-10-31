import { CjAdapter, parseCost } from '../lib/suppliers/cj-adapter';
import { PrintifyAdapter } from '../lib/suppliers/printify-adapter';
import { BlankaAdapter } from '../lib/suppliers/blanka-adapter';
import { TrendsiAdapter } from '../lib/suppliers/trendsi-adapter';
import { BrandsGatewayAdapter } from '../lib/suppliers/brandsgateway-adapter';
import { searchAllSuppliers, defaultAdapters } from '../lib/suppliers/router';
import { SupplierError, type SupplierAdapter, type NormalizedProduct } from '../lib/suppliers/types';

describe('CJ Adapter Cost Parsing & Normalization', () => {
  test('parseCost extracts maximum value from range string to avoid understating cost', () => {
    expect(parseCost('1.20 -- 3.40')).toBe(3.4);
    expect(parseCost('5.50')).toBe(5.5);
    expect(parseCost(12.99)).toBe(12.99);
    expect(parseCost('')).toBe(0);
    expect(parseCost(undefined)).toBe(0);
  });

  test('CjAdapter normalize maps fields and formats prices correctly', () => {
    const adapter = new CjAdapter(undefined, 4);
    const normalized = adapter.normalize({
      pid: 'test-pid-123',
      productNameEn: 'Magnetic Desk Sculpture Kinetic Sphere',
      productImage: 'https://images.example.com/img1.jpg',
      productImageSet: ['https://images.example.com/img2.jpg'],
      sellPrice: '4.50',
      categoryName: 'Tech Toys',
      productSku: 'CJ-SKU-99',
      description: '<p>High precision <b>neodymium</b> fidget spheres.</p>',
    });

    expect(normalized.id).toBe('CJ-test-pid-123');
    expect(normalized.supplier).toBe('CJ');
    expect(normalized.wholesaleCost).toBe(4.5);
    expect(normalized.retailPrice).toBeGreaterThan(normalized.wholesaleCost);
    expect(normalized.images).toHaveLength(2);
    expect(normalized.description).toBe('High precision neodymium fidget spheres.');
  });

  test('CjAdapter throws SupplierError when API key is missing', async () => {
    const adapter = new CjAdapter(undefined);
    await expect(adapter.searchProducts('phone', { page: 1, limit: 10 })).rejects.toThrow(SupplierError);
    await expect(adapter.getProduct('some-pid')).rejects.toThrow(SupplierError);
  });
});

describe('Printify Adapter Normalization', () => {
  test('PrintifyAdapter normalize selects cheapest active variant and cleans html', () => {
    const adapter = new PrintifyAdapter('dummy-token', 'dummy-shop-id');
    const normalized = adapter.normalize({
      id: 'printify-prod-1',
      title: 'Omnistu Cyberpunk Graphic Hoodie',
      description: '<p>100% Organic Cotton Streetwear</p>',
      tags: ['Apparel', 'Streetwear'],
      images: [{ src: 'https://images.example.com/hoodie.jpg' }],
      variants: [
        { id: 101, price: 4500, cost: 2200, is_enabled: true, is_available: true },
        { id: 102, price: 4200, cost: 2000, is_enabled: true, is_available: true },
        { id: 103, price: 3900, cost: 1800, is_enabled: false }, // disabled variant
      ],
    });

    expect(normalized).not.toBeNull();
    if (normalized) {
      expect(normalized.id).toBe('PRINTIFY-printify-prod-1');
      expect(normalized.retailPrice).toBe(42.0); // cheapest enabled variant ($42.00)
      expect(normalized.wholesaleCost).toBe(20.0);
      expect(normalized.description).toBe('100% Organic Cotton Streetwear');
      expect(normalized.inStock).toBe(true);
    }
  });

  test('PrintifyAdapter normalize returns null when no enabled variants exist', () => {
    const adapter = new PrintifyAdapter('dummy-token', 'dummy-shop-id');
    const normalized = adapter.normalize({
      id: 'printify-prod-2',
      title: 'Sold Out Item',
      variants: [{ id: 201, price: 5000, is_enabled: false }],
    });
    expect(normalized).toBeNull();
  });

  test('PrintifyAdapter throws SupplierError when credentials not set', async () => {
    const adapter = new PrintifyAdapter(undefined, undefined);
    await expect(adapter.searchProducts('hoodie', { page: 1, limit: 10 })).rejects.toThrow(SupplierError);
    await expect(adapter.getProduct('some-id')).rejects.toThrow(SupplierError);
  });
});

describe('Blanka Private-Label Skincare & Soap Adapter Normalization', () => {
  test('BlankaAdapter normalizes private-label turmeric soaps and skincare products', () => {
    const adapter = new BlankaAdapter('mock-blanka-token');
    const normalized = adapter.normalize({
      id: 'blanka-soap-101',
      title: 'Organic Turmeric & Kojic Acid Cleansing Bar',
      description: 'Handcrafted cold-pressed botanical soap for radiant skin.',
      wholesale_price: 6.5,
      product_type: 'Botanical Skincare',
      images: [{ src: 'https://images.example.com/soap.jpg' }],
      variants: [{ id: 'var-1', sku: 'BLANKA-TURMERIC-BAR' }],
    });

    expect(normalized.id).toBe('BLANKA-blanka-soap-101');
    expect(normalized.supplier).toBe('BLANKA');
    expect(normalized.sku).toBe('BLANKA-TURMERIC-BAR');
    expect(normalized.wholesaleCost).toBe(6.5);
    expect(normalized.retailPrice).toBeGreaterThan(normalized.wholesaleCost);
    expect(normalized.shippingNote).toContain('Omnistu Botanics');
  });

  test('BlankaAdapter returns empty array on search when API key is missing', async () => {
    const adapter = new BlankaAdapter(undefined);
    const results = await adapter.searchProducts('soap', { page: 1, limit: 10 });
    expect(results).toEqual([]);
  });
});

describe('Trendsi US-Warehoused Fashion Adapter Normalization', () => {
  test('TrendsiAdapter normalizes US apparel and calculates retail pricing', () => {
    const adapter = new TrendsiAdapter('mock-trendsi-key');
    const normalized = adapter.normalize({
      id: 'trendsi-jacket-55',
      title: 'Heavyweight Utility Bomber Jacket',
      description: 'Windproof technical utility outerwear.',
      wholesale_price: 28.0,
      category: "Men's Outerwear",
      sku: 'TR-JACKET-55',
      images: [{ url: 'https://images.example.com/jacket.jpg' }],
    });

    expect(normalized.id).toBe('TRENDSI-trendsi-jacket-55');
    expect(normalized.supplier).toBe('TRENDSI');
    expect(normalized.sku).toBe('TR-JACKET-55');
    expect(normalized.wholesaleCost).toBe(28.0);
    expect(normalized.retailPrice).toBeGreaterThan(28.0);
    expect(normalized.shippingNote).toContain('US-warehoused');
  });
});

describe('BrandsGateway Luxury Designer Adapter Normalization', () => {
  test('BrandsGatewayAdapter preserves designer retail price and brand prefix', () => {
    const adapter = new BrandsGatewayAdapter('mock-bg-token');
    const normalized = adapter.normalize({
      id: 'bg-watch-77',
      name: 'Chronograph Titanium Timepiece',
      brand: 'Versace',
      wholesale_price: 350.0,
      retail_price: 795.0,
      description: 'Swiss precision quartz movement with sapphire crystal.',
      sku: 'BG-VERSACE-77',
      images: ['https://images.example.com/watch.jpg'],
    });

    expect(normalized.id).toBe('BG-bg-watch-77');
    expect(normalized.supplier).toBe('BRANDSGATEWAY');
    expect(normalized.title).toBe('VERSACE - Chronograph Titanium Timepiece');
    expect(normalized.wholesaleCost).toBe(350.0);
    expect(normalized.retailPrice).toBe(795.0);
    expect(normalized.shippingNote).toContain('certificate of authenticity');
  });
});

describe('Supplier Router Parallel Execution & Fault Tolerance', () => {
  test('defaultAdapters dynamically instantiates adapters based on env keys', () => {
    const origCj = process.env.CJ_API_KEY;
    const origPrintifyToken = process.env.PRINTIFY_API_TOKEN;
    const origPrintifyShop = process.env.PRINTIFY_SHOP_ID;

    try {
      process.env.CJ_API_KEY = 'mock-cj-key';
      process.env.PRINTIFY_API_TOKEN = 'mock-printify-token';
      process.env.PRINTIFY_SHOP_ID = 'mock-shop-id';

      const adapters = defaultAdapters();
      expect(adapters.length).toBe(2);
      expect(adapters.map((a) => a.supplier)).toEqual(['CJ', 'PRINTIFY']);

      delete process.env.CJ_API_KEY;
      delete process.env.PRINTIFY_API_TOKEN;
      delete process.env.PRINTIFY_SHOP_ID;

      const emptyAdapters = defaultAdapters();
      expect(emptyAdapters.length).toBe(0);
    } finally {
      if (origCj) process.env.CJ_API_KEY = origCj;
      if (origPrintifyToken) process.env.PRINTIFY_API_TOKEN = origPrintifyToken;
      if (origPrintifyShop) process.env.PRINTIFY_SHOP_ID = origPrintifyShop;
    }
  });

  test('executes in parallel and does not fail when one supplier throws', async () => {
    const mockHealthyAdapter: SupplierAdapter = {
      supplier: 'CJ',
      searchProducts: jest.fn().mockResolvedValue([
        {
          id: 'CJ-1',
          supplier: 'CJ',
          supplierProductId: '1',
          sku: 'CJ-1',
          title: 'Smart Ring Health Tracker',
          description: '',
          specs: [],
          category: 'Wearables',
          wholesaleCost: 20,
          retailPrice: 49.99,
          compareAtPrice: null,
          images: ['https://example.com/ring.jpg'],
          inStock: true,
          stockQuantity: null,
          shippingNote: '',
        } as NormalizedProduct,
      ]),
      getProduct: jest.fn().mockResolvedValue(null),
    };

    const mockFailingAdapter: SupplierAdapter = {
      supplier: 'PRINTIFY',
      searchProducts: jest.fn().mockRejectedValue(new Error('Network timeout reaching Printify API')),
      getProduct: jest.fn().mockResolvedValue(null),
    };

    const res = await searchAllSuppliers('ring', { page: 1, limit: 10 }, [
      mockHealthyAdapter,
      mockFailingAdapter,
    ]);

    expect(res.products).toHaveLength(1);
    expect(res.products[0].title).toBe('Smart Ring Health Tracker');
    expect(res.errors).toHaveLength(1);
    expect(res.errors[0].supplier).toBe('PRINTIFY');
    expect(res.errors[0].message).toContain('Network timeout');
  });

  test('deduplicates identical products from same supplier', async () => {
    const duplicateProduct: NormalizedProduct = {
      id: 'CJ-1',
      supplier: 'CJ',
      supplierProductId: '1',
      sku: 'CJ-1',
      title: 'Item 1',
      description: '',
      specs: [],
      category: '',
      wholesaleCost: 10,
      retailPrice: 19.99,
      compareAtPrice: null,
      images: [],
      inStock: true,
      stockQuantity: null,
      shippingNote: '',
    };

    const mockAdapter: SupplierAdapter = {
      supplier: 'CJ',
      searchProducts: jest.fn().mockResolvedValue([duplicateProduct, duplicateProduct]),
      getProduct: jest.fn(),
    };

    const res = await searchAllSuppliers('item', { page: 1, limit: 10 }, [mockAdapter]);
    expect(res.products).toHaveLength(1);
  });
});
