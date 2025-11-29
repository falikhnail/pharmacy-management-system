import { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Package, AlertTriangle } from 'lucide-react';
import { Obat } from '@/types';
import { formatCurrency } from '@/lib/utils-pharmacy';
import { cn } from '@/lib/utils';

type AutocompleteSearchProps = {
  obatList: Obat[];
  value: string;
  onChange: (value: string) => void;
  onSelect: (obat: Obat) => void;
  placeholder?: string;
  className?: string;
};

export function AutocompleteSearch({
  obatList,
  value,
  onChange,
  onSelect,
  placeholder = 'Cari obat...',
  className,
}: AutocompleteSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredObat = value
    ? obatList
        .filter(
          (obat) =>
            obat.nama.toLowerCase().includes(value.toLowerCase()) ||
            obat.barcode.includes(value) ||
            obat.kategori.toLowerCase().includes(value.toLowerCase())
        )
        .slice(0, 8)
    : [];

  useEffect(() => {
    setSelectedIndex(0);
    setIsOpen(filteredObat.length > 0 && value.length > 0);
  }, [value, filteredObat.length]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || filteredObat.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredObat.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredObat[selectedIndex]) {
          handleSelect(filteredObat[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
    }
  };

  const handleSelect = (obat: Obat) => {
    onSelect(obat);
    onChange('');
    setIsOpen(false);
    inputRef.current?.focus();
  };

  const isStokLow = (obat: Obat) => obat.stokCurrent <= obat.stokMinimum;

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          className="pl-10"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => value && setIsOpen(true)}
        />
      </div>

      {isOpen && filteredObat.length > 0 && (
        <Card
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 max-h-96 overflow-y-auto shadow-lg"
        >
          <div className="p-1">
            {filteredObat.map((obat, index) => {
              const lowStock = isStokLow(obat);
              return (
                <div
                  key={obat.id}
                  className={cn(
                    'p-3 rounded-md cursor-pointer transition-colors',
                    index === selectedIndex
                      ? 'bg-accent'
                      : 'hover:bg-accent/50',
                    lowStock && 'border-l-4 border-amber-500'
                  )}
                  onClick={() => handleSelect(obat)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm truncate">
                          {obat.nama}
                        </h4>
                        {lowStock && (
                          <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Package size={12} />
                        <span className={lowStock ? 'text-amber-600 font-medium' : ''}>
                          Stok: {obat.stokCurrent} {obat.satuan}
                        </span>
                        <span>•</span>
                        <span>{obat.kategori}</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm text-primary">
                        {formatCurrency(obat.hargaJual)}
                      </p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {obat.bentuk}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-3 py-2 text-xs text-muted-foreground border-t bg-muted/50">
            Gunakan ↑↓ untuk navigasi, Enter untuk memilih
          </div>
        </Card>
      )}
    </div>
  );
}