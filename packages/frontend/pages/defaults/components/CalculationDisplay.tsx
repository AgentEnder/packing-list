interface BaseCalculation {
  quantity: number;
  perPerson: boolean;
  perDay: boolean;
  daysPattern?: { every: number; roundUp: boolean };
}

interface CalculationDisplayProps {
  baseCalculation: BaseCalculation;
  extraCalculation?: BaseCalculation;
  peopleCount: number;
  daysCount: number;
}

function formatPerDayPortion(
  calculation: Pick<BaseCalculation, 'perDay' | 'daysPattern'>,
  daysCount: number
) {
  if (!calculation.perDay) {
    return '';
  }
  if (calculation.daysPattern) {
    const periods = daysCount / calculation.daysPattern.every;
    if (calculation.daysPattern.roundUp) {
      return `${Math.ceil(periods)} ${
        calculation.daysPattern.every
      }-day periods`;
    }
    return `${Math.floor(periods)} ${
      calculation.daysPattern.every
    }-day periods`;
  }
  return `${daysCount} days`;
}

function formatQuantity(calculation: BaseCalculation) {
  if (
    calculation.quantity > 0 ||
    (calculation.quantity && !calculation.perPerson && !calculation.perDay)
  ) {
    return calculation.quantity.toString();
  }
  return '';
}

export const CalculationDisplay = ({
  baseCalculation,
  extraCalculation,
  peopleCount,
  daysCount,
}: CalculationDisplayProps) => {
  const prefixCol = extraCalculation?.quantity ? ['', '+'] : null;
  const cols: Array<[string | undefined, string | undefined]> = [];

  const baseQuantity = formatQuantity(baseCalculation);
  const extraQuantity = extraCalculation
    ? formatQuantity(extraCalculation)
    : '';

  if (baseQuantity || extraQuantity) {
    cols.push([baseQuantity, extraQuantity]);
  }

  if (
    (baseCalculation.perPerson || extraCalculation?.perPerson) &&
    peopleCount > 1
  ) {
    cols.push([
      baseCalculation.perPerson ? `${peopleCount} people` : '',
      extraCalculation?.perPerson ? `${peopleCount} people` : '',
    ]);
  }

  if ((baseCalculation.perDay || extraCalculation?.perDay) && daysCount > 0) {
    cols.push([
      baseCalculation.perDay
        ? formatPerDayPortion(baseCalculation, daysCount)
        : '',
      extraCalculation?.perDay
        ? formatPerDayPortion(extraCalculation, daysCount)
        : '',
    ]);
  }

  const rows: Array<Array<string | undefined>> = [[]];

  for (let i = 0; i < cols.length; i++) {
    const currentCol = cols[i];
    const nextCols = cols.slice(i + 1);
    const upperCell = currentCol[0];
    const lowerCell = currentCol[1];
    const needsUpperMult =
      upperCell && upperCell !== '×' && nextCols.some((col) => col[0]);
    const needsLowerMult =
      lowerCell && lowerCell !== '×' && nextCols.some((col) => col[1]);

    if (needsUpperMult || needsLowerMult) {
      cols.splice(i + 1, 0, [
        needsUpperMult ? '×' : '',
        needsLowerMult ? '×' : '',
      ]);
    }

    // Push top part to first row
    rows[0].push(cols[i][0]);
  }

  if (extraCalculation?.quantity) {
    rows.push([]);
    for (const col of cols) {
      rows[1].push(col[1]);
    }
    rows[0]?.unshift(prefixCol?.[0]);
    rows[1]?.unshift(prefixCol?.[1]);
  }

  return (
    <div
      className="grid items-center justify-end gap-x-1"
      style={{
        gridTemplateColumns: `repeat(${
          cols.length + (prefixCol ? 1 : 0)
        }, auto)`,
        gridTemplateRows: `repeat(${rows.length}, auto)`,
        rowGap: '0.125rem', // space-y-0.5 equivalent
      }}
    >
      {rows.flatMap((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <div key={`${rowIndex}-${colIndex}`}>{cell}</div>
        ))
      )}
    </div>
  );
};
