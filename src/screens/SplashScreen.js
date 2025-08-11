import { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const t = setTimeout(() => navigation.replace('Login'), 1500);
    return () => clearTimeout(t);
  }, [navigation]);

  return (
    <LinearGradient colors={['#F3E66D', '#EDA6C7']} style={styles.bg}>
      <View style={styles.center}>
        <Text style={styles.title}>Lana App</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 40, color: 'white', fontWeight: '700', letterSpacing: 1 },
});
