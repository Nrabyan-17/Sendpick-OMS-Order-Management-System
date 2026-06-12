import React, { useEffect, useMemo, useRef, useState } from 'react';

function classNames(...values) {
    return values.filter(Boolean).join(' ');
}

export default function FilterDropdown({
    value,
    onChange,
    options,
    widthClass = 'w-full',
    align = 'left',
    leadingIcon = null,
    leadingIconClassName = 'left-4',
    buttonClassName = '',
    menuClassName = '',
    optionClassName = '',
    placeholder = 'Pilih opsi',
    disabled = false,
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    const selectedOption = useMemo(() => options.find((option) => option.value === value) ?? null, [options, value]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('touchstart', handleClickOutside);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('touchstart', handleClickOutside);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    useEffect(() => {
        if (disabled && isOpen) {
            setIsOpen(false);
        }
    }, [disabled, isOpen]);

    const alignmentClass = align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left';

    const handleSelect = (option) => {
        if (!disabled) {
            onChange(option.value);
            setIsOpen(false);
        }
    };

    const buttonPaddingLeft = leadingIcon ? 'pl-11' : 'pl-4';

    return (
        <div ref={containerRef} className={classNames('relative', widthClass)}>
            <button
                type='button'
                disabled={disabled}
                aria-haspopup='listbox'
                aria-expanded={isOpen}
                onClick={() => setIsOpen((previous) => !previous)}
                className={classNames(
                    'relative flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white py-2.5 pr-12 text-sm font-medium text-slate-600 transition-all duration-200 ease-out focus:outline-none focus-visible:border-indigo-400 focus-visible:bg-indigo-50/40 focus-visible:ring-2 focus-visible:ring-indigo-500/20 focus-visible:ring-offset-2 focus-visible:ring-offset-white focus-visible:shadow-lg focus-visible:shadow-indigo-100 disabled:cursor-not-allowed disabled:opacity-60',
                    buttonPaddingLeft,
                    buttonClassName,
                )}
            >
                {leadingIcon ? (
                    <span className={classNames('pointer-events-none absolute inset-y-0 flex items-center text-slate-400', leadingIconClassName)}>
                        {leadingIcon}
                    </span>
                ) : null}
                <span className='truncate'>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <span
                    className={classNames(
                        'pointer-events-none absolute right-4 flex h-4 w-4 items-center justify-center text-slate-400 chevron-smooth',
                        isOpen ? 'chevron-expanded' : '',
                    )}
                >
                    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.5' className='h-4 w-4'>
                        <path d='m6 9 6 6 6-6' strokeLinecap='round' strokeLinejoin='round' />
                    </svg>
                </span>
            </button>
            <div
                className={classNames(
                    'absolute z-20 mt-2 w-full rounded-2xl border border-slate-200 bg-white p-2 shadow-xl dropdown-container dropdown-bounce-transition',
                    alignmentClass,
                    isOpen ? 'pointer-events-auto translate-y-0 scale-100 opacity-100' : 'pointer-events-none translate-y-2 scale-95 opacity-0',
                    menuClassName,
                )}
            >
                <div role='listbox' aria-activedescendant={selectedOption ? `dropdown-option-${selectedOption.value}` : undefined}>
                    {options.map((option, index) => {
                        const isActive = option.value === value;
                        return (
                            <button
                                key={option.value}
                                type='button'
                                role='option'
                                id={`dropdown-option-${option.value}`}
                                aria-selected={isActive}
                                className={classNames(
                                    'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm dropdown-item-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
                                    isActive ? 'bg-indigo-50 text-indigo-600 shadow-sm' : 'text-slate-600 hover:bg-slate-100 hover:text-indigo-600',
                                    isOpen ? `animate-dropdown-item-fade stagger-${Math.min(index + 1, 6)}` : '',
                                    optionClassName,
                                )}
                                onClick={() => handleSelect(option)}
                            >
                                <span className={classNames('flex h-2 w-2 rounded-full', isActive ? 'bg-indigo-500' : 'bg-slate-300')} />
                                <span className='truncate'>{option.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}