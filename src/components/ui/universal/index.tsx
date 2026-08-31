import React, { useState } from 'react';
import {
  View,
  Text as RNText,
  TouchableOpacity,
  TextInput as RNTextInput,
  Switch as RNSwitch,
  ScrollView as RNScrollView,
  StyleSheet,
  Platform,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { useTheme } from '@/hooks/use-theme';
import { ChevronDown, ChevronRight, Check } from 'lucide-react-native';
import { Modal } from '../Modal';

// ==============================================================================
// 1. HOST & RN HOST VIEW
// ==============================================================================
export interface HostProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

export function Host({ children, style }: HostProps) {
  return <View style={[{ flex: 1 }, style]}>{children}</View>;
}

export function RNHostView({ children, style }: HostProps) {
  return <View style={style}>{children}</View>;
}

// ==============================================================================
// 2. COLUMN & ROW (VStack / HStack)
// ==============================================================================
export interface StackProps {
  children?: React.ReactNode;
  spacing?: number;
  alignment?: 'leading' | 'center' | 'trailing' | 'stretch';
  style?: ViewStyle;
}

export function Column({
  children,
  spacing = 8,
  alignment = 'stretch',
  style,
}: StackProps) {
  const alignMap = {
    leading: 'flex-start' as const,
    center: 'center' as const,
    trailing: 'flex-end' as const,
    stretch: 'stretch' as const,
  };

  return (
    <View
      style={[
        {
          flexDirection: 'column',
          gap: spacing,
          alignItems: alignMap[alignment],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Row({
  children,
  spacing = 8,
  alignment = 'center',
  style,
}: StackProps) {
  const alignMap = {
    leading: 'flex-start' as const,
    center: 'center' as const,
    trailing: 'flex-end' as const,
    stretch: 'stretch' as const,
  };

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          gap: spacing,
          alignItems: alignMap[alignment],
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

// ==============================================================================
// 3. SPACER
// ==============================================================================
export interface SpacerProps {
  size?: number;
}

export function Spacer({ size }: SpacerProps) {
  if (size !== undefined) {
    return <View style={{ width: size, height: size }} />;
  }
  return <View style={{ flex: 1 }} />;
}

// ==============================================================================
// 4. BUTTON
// ==============================================================================
export interface UniversalButtonProps {
  label?: string;
  onPress?: () => void;
  variant?: 'filled' | 'tinted' | 'gray' | 'plain' | 'outline';
  color?: string;
  disabled?: boolean;
  style?: ViewStyle;
  children?: React.ReactNode;
}

export function Button({
  label,
  onPress,
  variant = 'filled',
  color = '#006a61',
  disabled = false,
  style,
  children,
}: UniversalButtonProps) {
  let bg = color;
  let textColor = '#FFFFFF';
  let borderW = 0;
  let borderColor = 'transparent';

  if (variant === 'tinted') {
    bg = color + '1A'; // ~10% opacity
    textColor = color;
  } else if (variant === 'gray') {
    bg = '#F1F5F9';
    textColor = '#0F172A';
  } else if (variant === 'plain') {
    bg = 'transparent';
    textColor = color;
  } else if (variant === 'outline') {
    bg = 'transparent';
    textColor = color;
    borderW = 1.5;
    borderColor = color;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.universalBtn,
        {
          backgroundColor: disabled ? '#E2E8F0' : bg,
          borderWidth: borderW,
          borderColor: borderColor,
          opacity: disabled ? 0.6 : 1,
        },
        style,
      ]}
    >
      {children ? (
        children
      ) : (
        <RNText style={[styles.universalBtnText, { color: textColor }]}>
          {label}
        </RNText>
      )}
    </TouchableOpacity>
  );
}

// ==============================================================================
// 5. TEXT
// ==============================================================================
export interface UniversalTextProps {
  children?: React.ReactNode;
  textStyle?: TextStyle;
  style?: TextStyle;
  variant?: 'headline' | 'title' | 'subheadline' | 'body' | 'caption';
}

export function Text({
  children,
  textStyle,
  style,
  variant = 'body',
}: UniversalTextProps) {
  const variantStyles: Record<string, TextStyle> = {
    headline: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
    title: { fontSize: 18, fontWeight: '700', letterSpacing: -0.3 },
    subheadline: { fontSize: 15, fontWeight: '600', color: '#475569' },
    body: { fontSize: 14, fontWeight: '400', color: '#0F172A' },
    caption: { fontSize: 12, fontWeight: '500', color: '#64748B' },
  };

  return (
    <RNText style={[variantStyles[variant], textStyle, style]}>
      {children}
    </RNText>
  );
}

// ==============================================================================
// 6. TEXT INPUT
// ==============================================================================
export interface UniversalTextInputProps {
  value?: string;
  onChangeText?: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  style?: TextStyle;
  disabled?: boolean;
}

export function TextInput({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  style,
  disabled = false,
}: UniversalTextInputProps) {
  return (
    <RNTextInput
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#94A3B8"
      secureTextEntry={secureTextEntry}
      editable={!disabled}
      style={[
        styles.universalInput,
        { backgroundColor: disabled ? '#F1F5F9' : '#FFFFFF' },
        style,
      ]}
    />
  );
}

// ==============================================================================
// 7. SWITCH & CHECKBOX
// ==============================================================================
export interface UniversalSwitchProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  color?: string;
  disabled?: boolean;
}

export function Switch({
  value,
  onValueChange,
  color = '#006a61',
  disabled = false,
}: UniversalSwitchProps) {
  return (
    <RNSwitch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: '#CBD5E1', true: color }}
      thumbColor="#FFFFFF"
      disabled={disabled}
    />
  );
}

export interface UniversalCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  color?: string;
  disabled?: boolean;
}

export function Checkbox({
  checked,
  onCheckedChange,
  label,
  color = '#006a61',
  disabled = false,
}: UniversalCheckboxProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      disabled={disabled}
      onPress={() => onCheckedChange(!checked)}
      style={styles.checkboxRow}
    >
      <View
        style={[
          styles.checkboxBox,
          checked
            ? { backgroundColor: color, borderColor: color }
            : { borderColor: '#94A3B8', backgroundColor: '#FFFFFF' },
        ]}
      >
        {checked && <Check size={14} color="#FFFFFF" />}
      </View>
      {label && <RNText style={styles.checkboxLabel}>{label}</RNText>}
    </TouchableOpacity>
  );
}

// ==============================================================================
// 8. PICKER / SEGMENTED CONTROL
// ==============================================================================
export interface UniversalPickerOption {
  label: string;
  value: string;
}

export interface UniversalPickerProps {
  options: UniversalPickerOption[];
  value: string;
  onValueChange: (val: string) => void;
  style?: ViewStyle;
}

export function Picker({
  options,
  value,
  onValueChange,
  style,
}: UniversalPickerProps) {
  return (
    <View style={[styles.pickerContainer, style]}>
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <TouchableOpacity
            key={opt.value}
            onPress={() => onValueChange(opt.value)}
            style={[
              styles.pickerSegment,
              isSelected && styles.pickerSegmentActive,
            ]}
          >
            <RNText
              style={[
                styles.pickerText,
                isSelected && styles.pickerTextActive,
              ]}
            >
              {opt.label}
            </RNText>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ==============================================================================
// 9. FIELD GROUP (Form Container)
// ==============================================================================
export interface FieldGroupProps {
  title?: string;
  children?: React.ReactNode;
  style?: ViewStyle;
}

export function FieldGroup({ title, children, style }: FieldGroupProps) {
  return (
    <View style={[styles.fieldGroupContainer, style]}>
      {title && <RNText style={styles.fieldGroupTitle}>{title.toUpperCase()}</RNText>}
      <View style={styles.fieldGroupCard}>{children}</View>
    </View>
  );
}

// ==============================================================================
// 10. COLLAPSIBLE
// ==============================================================================
export interface UniversalCollapsibleProps {
  title: string;
  children?: React.ReactNode;
  defaultExpanded?: boolean;
}

export function Collapsible({
  title,
  children,
  defaultExpanded = false,
}: UniversalCollapsibleProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={styles.collapsibleCard}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        style={styles.collapsibleHeader}
        activeOpacity={0.7}
      >
        <RNText style={styles.collapsibleTitle}>{title}</RNText>
        {expanded ? (
          <ChevronDown size={18} color="#64748B" />
        ) : (
          <ChevronRight size={18} color="#64748B" />
        )}
      </TouchableOpacity>
      {expanded && <View style={styles.collapsibleContent}>{children}</View>}
    </View>
  );
}

// ==============================================================================
// 11. LIST & LIST SECTION
// ==============================================================================
export interface UniversalListProps {
  children?: React.ReactNode;
  style?: ViewStyle;
}

export function List({ children, style }: UniversalListProps) {
  return <View style={[styles.listContainer, style]}>{children}</View>;
}

// ==============================================================================
// 12. BOTTOM SHEET
// ==============================================================================
export interface UniversalBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children?: React.ReactNode;
}

export function BottomSheet({
  visible,
  onClose,
  title,
  children,
}: UniversalBottomSheetProps) {
  return (
    <Modal visible={visible} onClose={onClose} title={title || ''}>
      {children}
    </Modal>
  );
}

// ==============================================================================
// 13. SLIDER
// ==============================================================================
export interface UniversalSliderProps {
  value: number;
  onValueChange: (val: number) => void;
  min?: number;
  max?: number;
  color?: string;
}

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  color = '#006a61',
}: UniversalSliderProps) {
  const percentage = Math.min(Math.max(((value - min) / (max - min)) * 100, 0), 100);

  return (
    <View style={styles.sliderTrack}>
      <View
        style={[
          styles.sliderFill,
          { width: `${percentage}%`, backgroundColor: color },
        ]}
      />
      <View
        style={[
          styles.sliderThumb,
          { left: `${percentage}%`, borderColor: color },
        ]}
      />
    </View>
  );
}

// ==============================================================================
// 14. ICON & SCROLLVIEW
// ==============================================================================
export { RNScrollView as ScrollView };

const styles = StyleSheet.create({
  universalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  universalBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  universalInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
  },
  pickerContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    padding: 3,
  },
  pickerSegment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  pickerSegmentActive: {
    backgroundColor: '#FFFFFF',
    ...Platform.select({
      web: { boxShadow: '0 1px 3px rgba(0,0,0,0.06)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 1,
      },
    }),
  },
  pickerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  pickerTextActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  fieldGroupContainer: {
    marginBottom: 16,
  },
  fieldGroupTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  fieldGroupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  collapsibleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 12,
  },
  collapsibleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  collapsibleTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  collapsibleContent: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  listContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    position: 'relative',
    marginVertical: 12,
  },
  sliderFill: {
    height: 6,
    borderRadius: 3,
  },
  sliderThumb: {
    position: 'absolute',
    top: -5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    marginLeft: -8,
  },
});
