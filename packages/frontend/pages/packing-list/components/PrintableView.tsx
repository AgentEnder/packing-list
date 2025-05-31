import React from 'react';
import { getAllCategories } from '@packing-list/model';

interface PrintItem {
  name: string;
  notes?: string;
  context: string;
  isExtra: boolean;
  quantity: number;
  person?: string; // For by-day view
  day?: string; // For by-person view
  dayStart?: number; // For items that span multiple days
  dayEnd?: number; // For items that span multiple days
  categoryId?: string;
  subcategoryId?: string;
}

interface PrintableViewProps {
  items: Record<string, PrintItem[]>;
  mode: 'by-day' | 'by-person';
  title?: string;
}

export const PrintableView: React.FC<PrintableViewProps> = ({
  items,
  mode,
  title,
}) => {
  const categories = getAllCategories();

  // Helper function to group items by category
  const groupItemsByCategory = (items: PrintItem[]) => {
    const grouped = new Map<string, PrintItem[]>();

    // First, group by main categories
    items.forEach((item) => {
      const categoryId = item.categoryId || 'uncategorized';
      if (!grouped.has(categoryId)) {
        grouped.set(categoryId, []);
      }
      grouped.get(categoryId)?.push(item);
    });

    // Sort categories by their order in the categories array
    return Array.from(grouped.entries()).sort((a, b) => {
      const catA = categories.findIndex((c) => c.id === a[0]);
      const catB = categories.findIndex((c) => c.id === b[0]);
      return catA - catB;
    });
  };

  return (
    <div className="print-container">
      <style>{`
        @page {
          size: letter;
          margin: 1in 0.5in;
        }

        .print-container {
          font-family: system-ui, -apple-system, sans-serif;
          line-height: 1.4;
          max-width: 8.5in;
          margin: 0 auto;
          padding: 0;
          color: #2d3748;
        }

        .report-container {
          width: 100%;
          margin-bottom: 32px;
          page-break-after: always;
        }
        
        .report-container:last-child {
          margin-bottom: 0;
          page-break-after: avoid;
        }

        .report-header {
          display: table-header-group;
        }
        
        .section-title {
          font-size: 24px;
          font-weight: 800;
          color: #1a202c;
          padding: 16px 0;
          border-bottom: 2px solid #e2e8f0;
          margin-bottom: 24px;
        }

        .category-section {
          margin-bottom: 24px;
        }

        .category-title {
          font-size: 18px;
          font-weight: 600;
          color: #4a5568;
          padding: 8px 0;
          margin-bottom: 12px;
          border-bottom: 1px solid #e2e8f0;
        }

        .item-list {
          list-style: none;
          margin: 0;
          padding: 0;
          columns: 2;
          column-gap: 32px;
          orphans: 4;
          widows: 4;
        }
        
        .item {
          display: flex;
          align-items: center;
          padding: 4px 0;
          gap: 8px;
          break-inside: avoid;
          page-break-inside: avoid;
        }
        
        .checkbox-container {
          flex-shrink: 0;
          width: 16px;
          height: 16px;
        }

        .checkbox {
          width: 16px;
          height: 16px;
          border: 2px solid #718096;
          border-radius: 4px;
          display: inline-block;
        }
        
        .item-details {
          flex-grow: 1;
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
          font-size: 14px;
          align-items: center;
        }
        
        .item-name {
          font-weight: 600;
          color: #2d3748;
          margin-right: 6px;
        }

        .item-context {
          color: #4a5568;
          font-weight: 500;
        }

        .quantity-badge {
          background: #edf2f7;
          color: #4a5568;
          padding: 1px 6px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
          margin-left: 4px;
        }

        .extra-badge {
          background: #feebc8;
          color: #9c4221;
          padding: 1px 6px;
          border-radius: 12px;
          font-size: 13px;
          font-weight: 600;
        }

        @media print {
          .item-list {
            column-fill: balance;
          }

          /* Set up named page for each section */
          .section {
            page: section;
          }

          @page section {
            @top-center {
              content: element(running-title);
            }
          }

          @page section:first {
            @top-center {
              content: none;
            }
          }

          /* Make the section title a running element */
          .section-title {
            position: running(running-title);
          }

          /* Hide the original title after the first page */
          .section-header {
            margin: 0;
            padding: 16px 0 24px;
          }
        }
      `}</style>

      {Object.entries(items).map(([context, contextItems]) => {
        const categorizedItems = groupItemsByCategory(contextItems);

        return (
          <table key={context} className="report-container">
            <thead className="report-header">
              <tr>
                <th>
                  <div className="section-title">
                    {context === 'General Items'
                      ? 'General Items - Packing List'
                      : `${context} - Packing List`}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="report-content">
              <tr>
                <td>
                  {categorizedItems.map(([categoryId, items]) => {
                    const category = categories.find(
                      (c) => c.id === categoryId
                    );
                    const categoryName = category?.name || 'Other Items';

                    return (
                      <div key={categoryId} className="category-section">
                        <h3 className="category-title">{categoryName}</h3>
                        <ul className="item-list">
                          {items.map((item, index) => (
                            <li
                              key={`${context}-${item.name}-${index}`}
                              className="item"
                            >
                              <div className="checkbox-container">
                                <div className="checkbox" />
                              </div>
                              <div className="item-details">
                                <span className="item-name">{item.name}</span>
                                {mode === 'by-day' && item.person && (
                                  <span className="item-context">
                                    for {item.person}
                                  </span>
                                )}
                                {mode === 'by-person' &&
                                  item.day &&
                                  item.day !== 'All Days' && (
                                    <span className="item-context">
                                      for {item.day}
                                    </span>
                                  )}
                                {item.isExtra && (
                                  <span className="extra-badge">extra</span>
                                )}
                                {item.quantity > 1 && (
                                  <span className="quantity-badge">
                                    ×{item.quantity}
                                  </span>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </td>
              </tr>
            </tbody>
          </table>
        );
      })}
    </div>
  );
};
