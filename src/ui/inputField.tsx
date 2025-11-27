import React from "react";

interface InputFieldProps {
  label: string;
  id: string;
}

export const InputField = ({label, id}: InputFieldProps) => {
  return (
    <label htmlFor={id}>
      {label}
      <input
        type="text"
        id={id}
        name={id}
        placeholder={label}
        className="w-full p-2 border-3 border-pink-500 rounded-[10px]"
      />
    </label>
  );
};
