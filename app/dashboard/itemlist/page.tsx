
"use client";
import React, { useState } from 'react';
import { AsyncPaginate, LoadOptions } from 'react-select-async-paginate';

type OptionType = {
  value: number;
  label: string;
};

export default function ItemSelect() {
  const [value, setValue] = useState<OptionType | null>(null);

  const loadOptions = async (search: string, loadedOptions: OptionType[], { page }: any) => {
    const res = await fetch(`http://149.102.143.102:8000/api/SearchItemsList/?q=${encodeURIComponent(search)}&page=${page}`);
    const json = await res.json();

    return {
      options: json.results.map((item: any) => ({
        value: item.id,
        label: item.text,
      })),
      hasMore: !!json.next,
      additional: {
        page: page + 1,
      },
    };
  };

  return (
    <AsyncPaginate
      value={value}
      loadOptions={loadOptions}
      onChange={setValue}
      placeholder="Select item..."
      additional={{ page: 1 }}
      isClearable
    />
  );
}
