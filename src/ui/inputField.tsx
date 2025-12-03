import React from "react";

interface InputFieldProps {
  type: string;
  label: string;
  id: string;
  defaultValue?: string;
}

export const InputField = ({type, label, id, defaultValue}: InputFieldProps) => {
  return (
    <label htmlFor={id}>
      {label}
      <input
        type={type}
        id={id}
        name={id}
        placeholder={label}
        defaultValue={defaultValue}
        className="w-full p-2 border-3 border-[#000000] rounded-[10px] bg-[#F2F2F2] text-[#000000] focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </label>
  );
};
