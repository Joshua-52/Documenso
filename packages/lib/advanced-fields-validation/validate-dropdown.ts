interface DropdownFieldMeta {
  readOnly?: boolean;
  required?: boolean;
  values?: { value: string }[];
  defaultValue?: string;
}

export const validateDropdownField = (
  value: string | undefined,
  fieldMeta: DropdownFieldMeta,
  isSigningPage: boolean = false,
): string[] => {
  const errors = [];

  console.log('validateDropdownField value', value);

  const { readOnly, required, values, defaultValue } = fieldMeta;

  if (readOnly && required) {
    errors.push('A field cannot be both read-only and required');
  }

  if (readOnly && (!values || values.length === 0)) {
    errors.push('A read-only field must have at least one value');
  }

  if (isSigningPage && required && !value) {
    errors.push('Choosing an option is required');
  }

  if (values && values.length === 0) {
    errors.push('Select field must have at least one option');
  }

  if (values && values.length === 0 && defaultValue) {
    errors.push('Default value must be one of the available options');
  }

  if (value && values && !values.find((item) => item.value === value)) {
    errors.push('Selected value must be one of the available options');
  }

  if (values && defaultValue && !values.find((item) => item.value === defaultValue)) {
    errors.push('Default value must be one of the available options');
  }

  return errors;
};
