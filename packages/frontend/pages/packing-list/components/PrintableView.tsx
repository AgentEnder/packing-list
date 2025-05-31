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

        .report-content {
          display: table-row-group;
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

        .category-badge {
          font-size: 0.75rem;
          color: #666;
          margin-left: 0.5rem;
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
      {Object.entries(items).map(([context, contextItems]) => (
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
                <ul className="item-list">
                  {contextItems.map((item, index) => {
                    const category = categories.find(
                      (cat) => cat.id === item.categoryId
                    );
                    const subcategory = categories.find(
                      (cat) => cat.id === item.subcategoryId
                    );
                    const categoryLabel = category
                      ? subcategory
                        ? `${category.name} / ${subcategory.name}`
                        : category.name
                      : '';

                    return (
                      <li
                        key={`${context}-${item.name}-${index}`}
                        className="item"
                      >
                        <div className="checkbox-container">
                          <div className="checkbox" />
                        </div>
                        <div className="item-details">
                          <span className="item-name">{item.name}</span>
                          {categoryLabel && (
                            <span className="category-badge">
                              {categoryLabel}
                            </span>
                          )}
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
                    );
                  })}
                </ul>
              </td>
            </tr>
          </tbody>
        </table>
      ))}
    </div>
  );
};
