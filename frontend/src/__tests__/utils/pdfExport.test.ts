import { describe, it, expect, vi, beforeEach } from 'vitest';
import { downloadInvoiceHTML, generateInvoiceBlob } from '../../utils/pdfExport';
import { Sale } from '../../types';

const mockSale: Sale = {
  id: 1,
  sale_number: 'VT20240115-001',
  customer_id: undefined,
  user_id: 1,
  total_amount: 15000,
  discount: 0,
  tax: 0,
  net_amount: 15000,
  payment_method: 'cash',
  payment_status: 'paid',
  notes: '',
  sale_date: '2024-01-15T10:00:00.000Z',
  created_at: '2024-01-15T10:00:00.000Z',
  items: [
    {
      id: 1,
      sale_id: 1,
      product_id: 1,
      product_name: 'Marteau 500g',
      quantity: 2,
      unit_price: 7500,
      subtotal: 15000,
      created_at: '2024-01-15T10:00:00.000Z'
    }
  ]
};

describe('PDF Export Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateInvoiceBlob', () => {
    it('should generate a Blob with HTML content', () => {
      const blob = generateInvoiceBlob(mockSale);

      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/html;charset=utf-8');
    });

    it('should include sale number in the blob content', async () => {
      const blob = generateInvoiceBlob(mockSale);
      const text = await blob.text();

      expect(text).toContain(mockSale.sale_number);
    });

    it('should include product name in the blob content', async () => {
      const blob = generateInvoiceBlob(mockSale);
      const text = await blob.text();

      expect(text).toContain('Marteau 500g');
    });

    it('should include total amount in the blob content', async () => {
      const blob = generateInvoiceBlob(mockSale);
      const text = await blob.text();

      expect(text).toContain('15');
    });
  });

  describe('downloadInvoiceHTML', () => {
    it('should create and click a download link', () => {
      const createElementSpy = vi.spyOn(document, 'createElement');
      const appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => document.createElement('a'));
      const removeChildSpy = vi.spyOn(document.body, 'removeChild').mockImplementation(() => document.createElement('a'));

      const mockLink = {
        href: '',
        download: '',
        click: vi.fn(),
      };
      createElementSpy.mockReturnValue(mockLink as unknown as HTMLAnchorElement);

      downloadInvoiceHTML(mockSale);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(mockLink.download).toContain('facture-');
      expect(mockLink.download).toContain(mockSale.sale_number);
      expect(mockLink.click).toHaveBeenCalled();

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });
});
