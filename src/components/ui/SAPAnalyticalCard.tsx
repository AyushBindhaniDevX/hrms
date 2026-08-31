import React from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react-native';

interface MetricItem {
  label: string;
  value: string | number;
  semanticColor?: string;
}

interface SAPAnalyticalCardProps {
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

export function SAPAnalyticalCard({
  kpiTitle,
  category = 'HUMAN CAPITAL',
  value,
  unit,
  trend,
  targetText,
  targetPercent,
  metrics,
  onPress,
}: SAPAnalyticalCardProps) {
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
      {/* SAP Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.categoryText}>{category.toUpperCase()}</Text>
          <Text style={styles.kpiTitleText} numberOfLines={1}>
            {kpiTitle}
          </Text>
        </View>
        {onPress && (
          <View style={styles.actionArrow}>
            <ChevronRight size={16} color="#64748B" />
          </View>
        )}
      </View>

      {/* Primary Value & Trend Badge */}
      <View style={styles.valueRow}>
        <View style={styles.valueGroup}>
          <Text style={styles.primaryValue}>{value}</Text>
          {unit && <Text style={styles.unitText}>{unit}</Text>}
        </View>

        {trend && (
          <View style={[styles.trendBadge, { backgroundColor: trendBg }]}>
            {isUp ? (
              <TrendingUp size={13} color={trendColor} />
            ) : isDown ? (
              <TrendingDown size={13} color={trendColor} />
            ) : (
              <Minus size={13} color="#64748B" />
            )}
            <Text style={[styles.trendText, { color: trendColor }]}>
              {trend.value}
            </Text>
          </View>
        )}
      </View>

      {/* Target Progress (if provided) */}
      {targetPercent !== undefined && (
        <View style={styles.targetSection}>
          <View style={styles.progressBarBg}>
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
          {targetText && <Text style={styles.targetSub}>{targetText}</Text>}
        </View>
      )}

      {/* Bottom Metric Strip */}
      {metrics && metrics.length > 0 && (
        <View style={styles.metricsStrip}>
          {metrics.map((m, idx) => (
            <React.Fragment key={m.label}>
              {idx > 0 && <View style={styles.metricDivider} />}
              <View style={styles.metricItem}>
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
            </React.Fragment>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    gap: 14,
    ...Platform.select({
      web: { boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  kpiTitleText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  actionArrow: {
    padding: 4,
    borderRadius: 6,
    backgroundColor: '#F8FAFC',
  },

  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  valueGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  primaryValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  unitText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },

  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '800',
  },

  targetSection: {
    gap: 6,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F1F5F9',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  targetSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },

  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 20,
    backgroundColor: '#E2E8F0',
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
});
