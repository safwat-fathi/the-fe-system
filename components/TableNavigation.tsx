"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface TableNavigationProps {
  rows: number;
  cols: number;
  onCellSelect?: (rowIndex: number, colIndex: number) => void;
  onCellEdit?: (rowIndex: number, colIndex: number, value: any) => void;
  onRowAdd?: () => void;
  onRowDelete?: (rowIndex: number) => void;
  editable?: boolean;
  autoAddRows?: boolean;
  simple?: boolean; // New prop to enable simple mode
  className?: string;
  children: React.ReactNode;
}

export default function TableNavigation({
  rows,
  cols,
  onCellSelect,
  onCellEdit,
  onRowAdd,
  onRowDelete,
  editable = true,
  autoAddRows = true,
  simple = false,
  className = "",
  children
}: TableNavigationProps) {
  const [currentRow, setCurrentRow] = useState(0);
  const [currentCol, setCurrentCol] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<(HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null)[][]>([]);

  // Initialize input references
  useEffect(() => {
    inputRefs.current = Array(rows).fill(null).map(() => Array(cols).fill(null));
  }, [rows, cols]);

  // Add input reference
  const addInputRef = useCallback((rowIndex: number, colIndex: number, ref: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null) => {
    if (!inputRefs.current[rowIndex]) {
      inputRefs.current[rowIndex] = [];
    }
    inputRefs.current[rowIndex][colIndex] = ref;
  }, []);

  // Navigate to cell
  const navigateToCell = useCallback((rowIndex: number, colIndex: number) => {
    if (rowIndex < 0 || rowIndex >= rows || colIndex < 0 || colIndex >= cols) {
      return;
    }

    setCurrentRow(rowIndex);
    setCurrentCol(colIndex);
    
    const targetInput = inputRefs.current[rowIndex]?.[colIndex];
    if (targetInput && editable) {
      targetInput.focus();
      if (targetInput instanceof HTMLInputElement) {
        targetInput.select();
      }
    }

    onCellSelect?.(rowIndex, colIndex);
  }, [rows, cols, editable, onCellSelect]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!editable) return;

    switch (e.key) {
      case "Tab":
        e.preventDefault();
        if (e.shiftKey) {
          // Navigate backward
          if (currentCol > 0) {
            navigateToCell(currentRow, currentCol - 1);
          } else if (currentRow > 0) {
            navigateToCell(currentRow - 1, cols - 1);
          }
        } else {
          // Navigate forward
          if (currentCol < cols - 1) {
            navigateToCell(currentRow, currentCol + 1);
          } else if (currentRow < rows - 1) {
            navigateToCell(currentRow + 1, 0);
          } else if (autoAddRows && onRowAdd) {
            onRowAdd();
            setTimeout(() => navigateToCell(rows, 0), 100);
          }
        }
        break;

      case "Enter":
        e.preventDefault();
        if (simple) {
          // Simple mode: just navigate down
          if (currentRow < rows - 1) {
            navigateToCell(currentRow + 1, currentCol);
          } else if (onRowAdd) {
            onRowAdd();
            setTimeout(() => navigateToCell(rows, currentCol), 100);
          }
        } else {
          // Advanced mode: toggle editing
          if (isEditing) {
            setIsEditing(false);
            if (currentRow < rows - 1) {
              navigateToCell(currentRow + 1, currentCol);
            } else if (autoAddRows && onRowAdd) {
              onRowAdd();
              setTimeout(() => navigateToCell(rows, currentCol), 100);
            }
          } else {
            setIsEditing(true);
          }
        }
        break;

      case "Escape":
        if (!simple) {
          setIsEditing(false);
        }
        break;

      case "ArrowUp":
        e.preventDefault();
        if (currentRow > 0) {
          navigateToCell(currentRow - 1, currentCol);
        }
        break;

      case "ArrowDown":
        e.preventDefault();
        if (currentRow < rows - 1) {
          navigateToCell(currentRow + 1, currentCol);
        } else if (autoAddRows && onRowAdd) {
          onRowAdd();
          setTimeout(() => navigateToCell(rows, currentCol), 100);
        }
        break;

      case "ArrowLeft":
        e.preventDefault();
        if (currentCol > 0) {
          navigateToCell(currentRow, currentCol - 1);
        }
        break;

      case "ArrowRight":
        e.preventDefault();
        if (currentCol < cols - 1) {
          navigateToCell(currentRow, currentCol + 1);
        }
        break;

      case "Delete":
        if (e.ctrlKey && onRowDelete) {
          e.preventDefault();
          onRowDelete(currentRow);
        }
        break;

      case "F2":
        if (!simple) {
          e.preventDefault();
          setIsEditing(true);
        }
        break;
    }
  }, [currentRow, currentCol, rows, cols, editable, isEditing, autoAddRows, onRowAdd, onRowDelete, navigateToCell, simple]);

  // Add keyboard listener
  useEffect(() => {
    const element = tableRef.current;
    if (!element) return;

    element.addEventListener("keydown", handleKeyDown);
    return () => element.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Export functions for external use
  useEffect(() => {
    if (tableRef.current) {
      (tableRef.current as any).tableNavigation = {
        navigateToCell,
        addInputRef,
        currentRow,
        currentCol,
        isEditing: simple ? undefined : isEditing,
        setIsEditing: simple ? undefined : setIsEditing
      };
    }
  }, [navigateToCell, addInputRef, currentRow, currentCol, isEditing, simple]);

  const cssClass = simple ? 'simple-table-navigation' : 'table-navigation';

  return (
    <div 
      ref={tableRef}
      className={`${cssClass} ${className}`}
      tabIndex={0}
    >
      {children}
    </div>
  );
}

// Unified hook for table fields
export function useTableField(
  rowIndex: number, 
  colIndex: number, 
  value: any, 
  onChange: (value: any) => void,
  onEnter?: () => void,
  simple: boolean = false
) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null);

  const handleFocus = () => {
    if (simple) {
      // Update current position for simple mode
      const tableElement = document.querySelector('.simple-table-navigation') as any;
      if (tableElement?.tableNavigation) {
        tableElement.tableNavigation.navigateToCell(rowIndex, colIndex);
      }
    } else {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    if (!simple) {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onEnter?.();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  // Add references to table
  useEffect(() => {
    const cssClass = simple ? '.simple-table-navigation' : '.table-navigation';
    const tableElement = document.querySelector(cssClass) as any;
    if (tableElement?.tableNavigation) {
      tableElement.tableNavigation.addInputRef(rowIndex, colIndex, inputRef.current);
    }
  }, [rowIndex, colIndex, simple]);

  return {
    ref: inputRef,
    value,
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: simple ? undefined : handleBlur,
    onKeyDown: handleKeyDown,
    isEditing: simple ? undefined : isEditing
  };
}

// Specialized hooks for different input types
export function useTableInput(
  rowIndex: number, 
  colIndex: number, 
  value: any, 
  onChange: (value: any) => void,
  onEnter?: () => void,
  simple: boolean = false
) {
  const [isEditing, setIsEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFocus = () => {
    if (simple) {
      const tableElement = document.querySelector('.simple-table-navigation') as any;
      if (tableElement?.tableNavigation) {
        tableElement.tableNavigation.navigateToCell(rowIndex, colIndex);
      }
    } else {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    if (!simple) {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onEnter?.();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  useEffect(() => {
    const cssClass = simple ? '.simple-table-navigation' : '.table-navigation';
    const tableElement = document.querySelector(cssClass) as any;
    if (tableElement?.tableNavigation) {
      tableElement.tableNavigation.addInputRef(rowIndex, colIndex, inputRef.current);
    }
  }, [rowIndex, colIndex, simple]);

  return {
    ref: inputRef,
    value,
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: simple ? undefined : handleBlur,
    onKeyDown: handleKeyDown,
    isEditing: simple ? undefined : isEditing
  };
}

export function useTableSelect(
  rowIndex: number, 
  colIndex: number, 
  value: any, 
  onChange: (value: any) => void,
  onEnter?: () => void,
  simple: boolean = false
) {
  const [isEditing, setIsEditing] = useState(false);
  const selectRef = useRef<HTMLSelectElement>(null);

  const handleFocus = () => {
    if (simple) {
      const tableElement = document.querySelector('.simple-table-navigation') as any;
      if (tableElement?.tableNavigation) {
        tableElement.tableNavigation.navigateToCell(rowIndex, colIndex);
      }
    } else {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    if (!simple) {
      setIsEditing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onEnter?.();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  useEffect(() => {
    const cssClass = simple ? '.simple-table-navigation' : '.table-navigation';
    const tableElement = document.querySelector(cssClass) as any;
    if (tableElement?.tableNavigation) {
      tableElement.tableNavigation.addInputRef(rowIndex, colIndex, selectRef.current);
    }
  }, [rowIndex, colIndex, simple]);

  return {
    ref: selectRef,
    value,
    onChange: handleChange,
    onFocus: handleFocus,
    onBlur: simple ? undefined : handleBlur,
    onKeyDown: handleKeyDown,
    isEditing: simple ? undefined : isEditing
  };
}

// Backward compatibility exports
export { useTableField as useSimpleTableField };
