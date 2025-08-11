import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, ScrollView, Platform, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiFetch, setToken } from '../services/api';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!password || (!email && !phone)) {
      Alert.alert('Faltan datos', 'Ingresa correo o teléfono y tu contraseña.');
      return;
    }
    try {
      setLoading(true);

      const res = await apiFetch('/validateUser', {
        method: 'POST',
        body: {
          email: email || null,
          phone: phone || null,
          password,
        },
      });

      // Backend recomendado devuelve { token }
      const token = res?.token ?? (typeof res === 'string' ? res : null);
      if (!token) throw new Error('No se recibió token');

      await setToken(token);
      navigation.replace('Transactions');
    } catch (e) {
      Alert.alert('No se pudo iniciar sesión', e?.message || 'Error de red');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#f9e26a', '#e99ebe']} style={{ flex:1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex:1 }}>
        <ScrollView contentContainerStyle={{ flexGrow:1, justifyContent:'center', padding:16 }}>
          <View style={s.card}>
            <Text style={s.title}>Inicio Sesión</Text>

            <Text style={s.label}>Correo electrónico (opcional)</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="tucorreo@ejemplo.com"
            />

            <Text style={s.label}>Teléfono (opcional)</Text>
            <TextInput
              style={s.input}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="4421234567"
              maxLength={10}
            />

            <Text style={s.label}>Contraseña</Text>
            <TextInput
              style={s.input}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
            />

            <TouchableOpacity
              style={[s.btn, loading && { opacity: 0.6 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              <Text style={s.btnText}>{loading ? 'Entrando...' : 'Iniciar'}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={s.link}>¿Aún no tienes una cuenta?</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  card:{ backgroundColor:'#fff', borderRadius:14, padding:20, alignSelf:'center', width:'92%', maxWidth:360, shadowOpacity:0.2, shadowRadius:10 },
  title:{ fontSize:24, fontWeight:'800', textAlign:'center', color:'#7f5aa8', marginBottom:10 },
  label:{ marginTop:8, marginBottom:4, color:'#444' },
  input:{ backgroundColor:'#eee', borderRadius:8, height:40, paddingHorizontal:10 },
  btn:{ marginTop:14, backgroundColor:'#8e77c8', paddingVertical:12, borderRadius:10, alignItems:'center' },
  btnText:{ color:'#fff', fontWeight:'700' },
  link:{ marginTop:10, textAlign:'center', color:'#6f5ba8', textDecorationLine:'underline' }
});
