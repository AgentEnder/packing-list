import { useAppSelector } from '@packing-list/state';

export default function Page() {
  const people = useAppSelector((state) => state.people);
  const trip = useAppSelector((state) => state.trip);
  const defaultItems = useAppSelector((state) => state.calculated.defaultItems);

  return (
    <>
      <h1 className={'font-bold text-3xl pb-4'}>Packing List</h1>
      For the upcoming trip, we have {people.length} people. There are{' '}
      {trip.days.length} days in the trip.
      <div className={'flex flex-col gap-4'}>
        {defaultItems.map((item) => (
          <div key={item.name}>
            {item.name} - {item.quantity}
          </div>
        ))}
      </div>
    </>
  );
}
