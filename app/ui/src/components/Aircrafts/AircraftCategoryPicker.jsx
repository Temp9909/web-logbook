import { useMemo, useState } from 'react';
import { DEFAULT_CATEGORIES, isAircraftCategoryAllowed, splitCategories } from './aircraftCategories';

const joinCategories = (items) => Array.from(new Set(
  items.map((item) => String(item || '').trim()).filter(Boolean),
)).join(',');

const AircraftCategoryPicker = ({ label = 'Category', value = '', options = [], excludeOptions = [], onChange, includeDefaultOptions = true, allowNew = true }) => {
  const [newCategory, setNewCategory] = useState('');
  const selected = useMemo(() => new Set(splitCategories(value)), [value]);
  const excluded = useMemo(() => new Set(
    (Array.isArray(excludeOptions) ? excludeOptions : splitCategories(excludeOptions))
      .map((item) => String(item || '').trim())
      .filter(Boolean),
  ), [excludeOptions]);
  const allOptions = useMemo(() => Array.from(new Set([
    ...(includeDefaultOptions ? DEFAULT_CATEGORIES : []),
    ...options,
    ...splitCategories(value),
  ])).filter((category) => category && isAircraftCategoryAllowed(category) && !excluded.has(category)).sort((a, b) => a.localeCompare(b)), [excluded, includeDefaultOptions, options, value]);

  const toggle = (category) => {
    const next = new Set(selected);
    if (next.has(category)) next.delete(category);
    else next.add(category);
    onChange?.(joinCategories(Array.from(next)));
  };

  const addCategory = () => {
    const nextCategory = newCategory.trim();
    if (!nextCategory || !isAircraftCategoryAllowed(nextCategory)) return;
    const next = new Set(selected);
    next.add(nextCategory);
    onChange?.(joinCategories(Array.from(next)));
    setNewCategory('');
  };

  return (
    <div className="field exact-category-field">
      <span>{label}</span>
      <div className="exact-category-picker">
        {allOptions.map((category) => (
          <button
            key={category}
            type="button"
            className={`exact-category-option${selected.has(category) ? ' selected' : ''}`}
            onClick={() => toggle(category)}
          >
            {category}
          </button>
        ))}
      </div>
      {allowNew ? <div className="row exact-category-add-row">
        <input
          className="input"
          value={newCategory}
          onChange={(event) => setNewCategory(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              addCategory();
            }
          }}
          placeholder="New category…"
        />
        <button type="button" className="btn small" onClick={addCategory}>Add</button>
      </div> : null}
    </div>
  );
};

export default AircraftCategoryPicker;
