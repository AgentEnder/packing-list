import { DefaultItemRule, Person, Day } from '@packing-list/model';
import { RuleCard } from './RuleCard';

type RuleListProps = {
  rules: DefaultItemRule[];
  people: Person[];
  days: Day[];
  canEdit?: boolean;
};

export const RuleList = ({
  rules,
  people,
  days,
  canEdit = true,
}: RuleListProps) => {
  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="card-body">
        <h2 className="card-title">Existing Rules</h2>
        <div className="space-y-4" data-testid="rules-list">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="card bg-base-200"
              data-testid={`rule-item-${rule.id}`}
            >
              <div className="card-body">
                <RuleCard
                  rule={rule}
                  people={people}
                  days={days}
                  canEdit={canEdit}
                />
              </div>
            </div>
          ))}
          {rules.length === 0 && (
            <div className="alert" data-testid="no-rules-message">
              <span>No rules added yet</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
