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
        className="w-full p-2 border-3 border-pink-500 rounded-[10px]"
      />
    </label>
  );
};
