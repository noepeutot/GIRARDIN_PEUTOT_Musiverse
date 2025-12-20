import React, { ChangeEvent } from "react";

interface InputFieldProps {
  type: string;
  label: string;
  id: string;
  defaultValue?: string;
  value?: string;
  onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const InputField = ({type, label, id, defaultValue, value, onChange}: InputFieldProps) => {
  return (
    <label htmlFor={id}>
      {label}
      <input
        type={type}
        id={id}
        name={id}
        placeholder={label}
        defaultValue={defaultValue}
        value={value}
        onChange={onChange}
        className="w-full p-2 border-3 border-[#000000] rounded-[10px] bg-[#F2F2F2] text-[#000000] focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </label>
  );
};
