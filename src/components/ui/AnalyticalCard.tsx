import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react-native';

interface MetricItem {
  label: string;
  value: string | number;
  semanticColor?: string;
}

export interface AnalyticalCardProps {
  kpiTitle: string;
  category?: string;
  value: string | number;
  unit?: string;
  trend?: {
    direction: 'up' | 'down' | 'neutral';
    value: string;
    isPositive?: boolean;
  };
  targetText?: string;
  targetPercent?: number; // 0 to 100
  metrics?: MetricItem[];
  onPress?: () => void;
}

export function AnalyticalCard({
  kpiTitle,
  category = 'ENTERPRISE METRIC',
  value,
  unit,
  trend,
  targetText,
  targetPercent,
  metrics,
  onPress,
}: AnalyticalCardProps) {
  const isUp = trend?.direction === 'up';
  const isDown = trend?.direction === 'down';
  const trendPositive = trend?.isPositive ?? isUp;

  const trendColor = trendPositive ? '#107E3E' : '#BB0000';
  const trendBg = trendPositive ? '#EAF7EE' : '#FDECEC';

  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.75 : 1}
      onPress={onPress}
      style={styles.card}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.categoryText}>{category.toUpperCase()}</Text>
          <Text style={styles.kpiTitleText} numberOfLines={1}>
            {kpiTitle}
          </Text>
        </View>
        {onPress && (
          <View style={styles.actionArrow}>
            <ChevronRight size={14} color="#64748B" />
          </View>
        )}
      </View>

      {/* KPI Value & Trend Badge */}
      <View style={styles.mainValRow}>
        <View style={styles.valGroup}>
          <Text style={styles.kpiValueText}>{value}</Text>
          {unit && <Text style={styles.unitText}>{unit}</Text>}
        </View>

        {trend && (
          <View style={[styles.trendBadge, { backgroundColor: trendBg }]}>
            {isUp && <TrendingUp size={12} color={trendColor} />}
            {isDown && <TrendingDown size={12} color={trendColor} />}
            {!isUp && !isDown && <Minus size={12} color={trendColor} />}
            <Text style={[styles.trendText, { color: trendColor }]}>
              {trend.value}
            </Text>
          </View>
        )}
      </View>

      {/* Target Progress Bar */}
      {targetPercent !== undefined && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.min(Math.max(targetPercent, 0), 100)}%`,
                  backgroundColor:
                    targetPercent >= 80
                      ? '#107E3E'
                      : targetPercent >= 50
                      ? '#DF6E0C'
                      : '#BB0000',
                },
              ]}
            />
          </View>
          {targetText && (
            <Text style={styles.targetText}>{targetText}</Text>
          )}
        </View>
      )}

      {/* Sub-Metrics Footer Strip */}
      {metrics && metrics.length > 0 && (
        <View style={styles.metricsFooter}>
          {metrics.map((m, idx) => (
            <View key={idx} style={styles.metricCol}>
              <Text style={styles.metricLabel}>{m.label}</Text>
              <Text
                style={[
                  styles.metricValue,
                  m.semanticColor ? { color: m.semanticColor } : null,
                ]}
              >
                {m.value}
              </Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

// Backward-compatible alias
export const SAPAnalyticalCard = AnalyticalCard;
export type SAPAnalyticalCardProps = AnalyticalCardProps;

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    ...Platform.select({
      web: {
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  kpiTitleText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  actionArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mainValRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  valGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  kpiValueText: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  unitText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressContainer: {
    marginTop: 8,
    gap: 4,
  },
  progressBarTrack: {
    height: 4,
    backgroundColor: '#F1F5F9',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  targetText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  metricsFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  metricCol: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
});
