import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef } from 'react';
import { Calendar, Share, Crown } from 'lucide-react-native';

interface ResultCardProps {
  result: {
    id: string;
    testName: string;
    archetype: string;
    score: number;
    date: string;
    isPremium: boolean;
  };
  index: number;
}

export default function ResultCard({ result, index }: ResultCardProps) {
  const cardAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(cardAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 150,
      useNativeDriver: true,
    }).start();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#00A3FF';
    if (score >= 60) return '#C8A951';
    return '#B3B3B3';
  };

  return (
    <Animated.View
      style={{
        opacity: cardAnim,
        transform: [{
          translateY: cardAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          })
        }]
      }}
    >
      <TouchableOpacity style={[
        styles.resultCard,
        result.isPremium && styles.premiumResultCard
      ]} activeOpacity={0.85}>
        {result.isPremium && (
          <LinearGradient
            colors={['rgba(200, 169, 81, 0.08)', 'rgba(200, 169, 81, 0.03)', 'transparent']}
            style={styles.premiumCardGlow}
          />
        )}
        
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <View style={styles.testInfo}>
              <Text style={styles.testName}>{result.testName}</Text>
              <Text style={[
                styles.archetype,
                result.isPremium && styles.premiumArchetype
              ]}>{result.archetype}</Text>
            </View>
            {result.isPremium && (
              <View style={styles.premiumBadge}>
                <LinearGradient
                  colors={['#C8A951', '#E6C068']}
                  style={styles.premiumIndicator}
                >
                  <Crown size={14} color="#0D0D0D" strokeWidth={1.5} />
                </LinearGradient>
              </View>
            )}
          </View>

          <View style={styles.scoreSection}>
            <View style={[
              styles.scoreContainer, 
              { borderColor: getScoreColor(result.score) },
              result.isPremium && styles.premiumScoreContainer
            ]}>
              <LinearGradient
                colors={result.isPremium ? 
                  ['rgba(200, 169, 81, 0.1)', 'transparent'] : 
                  ['rgba(0, 163, 255, 0.05)', 'transparent']
                }
                style={styles.scoreGradient}
              />
              <Text style={[
                styles.scoreText, 
                { color: getScoreColor(result.score) }
              ]}>
                {result.score}%
              </Text>
            </View>
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.dateContainer}>
              <Calendar size={12} color="#666666" strokeWidth={1.5} />
              <Text style={styles.date}>{result.date}</Text>
            </View>
            <TouchableOpacity style={styles.shareButton}>
              <Share size={14} color="#00A3FF" strokeWidth={1.5} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  resultCard: {
    backgroundColor: '#0D0D0D',
    borderWidth: 1,
    borderColor: '#1A1A1A',
    borderRadius: 18,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  premiumResultCard: {
    borderColor: 'rgba(200, 169, 81, 0.25)',
  },
  premiumCardGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  cardContent: {
    padding: 20,
    position: 'relative',
    zIndex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  testInfo: {
    flex: 1,
  },
  testName: {
    fontSize: 16,
    color: '#F5F5F5',
    fontFamily: 'Playfair-SemiBold',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  archetype: {
    fontSize: 14,
    color: '#00A3FF',
    fontFamily: 'Inter-Medium',
    letterSpacing: 0.2,
  },
  premiumArchetype: {
    color: '#C8A951',
  },
  premiumBadge: {
    marginLeft: 12,
  },
  premiumIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0D0D0D',
    position: 'relative',
    overflow: 'hidden',
  },
  premiumScoreContainer: {
    shadowColor: '#C8A951',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  scoreGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  scoreText: {
    fontSize: 18,
    fontFamily: 'Playfair-Bold',
    letterSpacing: -0.5,
    zIndex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  date: {
    fontSize: 12,
    color: '#666666',
    fontFamily: 'Inter-Regular',
    letterSpacing: 0.3,
  },
  shareButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 163, 255, 0.1)',
  },
});