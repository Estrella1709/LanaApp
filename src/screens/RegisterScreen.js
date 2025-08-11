import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, ScrollView, Platform, Alert, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { apiFetch, setToken } from '../services/api';

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [lastname, setLastname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState(''); // 10 dígitos
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    // Validaciones rápidas acordes a tu Pydantic
    const phoneClean = phone.replace(/\D/g, '');
    if (name.trim().length < 3) return Alert.alert('Registro', 'Nombre mínimo 3 caracteres.');
    if (lastname.trim().length < 3) return Alert.alert('Registro', 'Apellido mínimo 3 caracteres.');
    if (!email.includes('@')) return Alert.alert('Registro', 'Correo no válido.');
    if (phoneClean.length !== 10) return Alert.alert('Registro', 'Teléfono debe tener 10 dígitos.');
    if (!password) return Alert.alert('Registro', 'La contraseña es obligatoria.');
    if (password !== confirm) return Alert.alert('Registro', 'Las contraseñas no coinciden.');

    try {
      setLoading(true);

      // 1) Registrar
      await apiFetch('/registerUser', {
        method: 'POST',
        body: {
          name: name.trim(),
          lastname: lastname.trim(),
          email: email.trim(),
          phone: phoneClean,
          password,
        },
      });

      // 2) Auto-login (intenta con email+password)
      try {
        const loginRes = await apiFetch('/validateUser', {
          method: 'POST',
          body: {
            email: email.trim(),
            password,
          },
        });
        // La API devuelve un token plano o { token: '...' }
        const token = typeof loginRes === 'string'
          ? loginRes
          : loginRes?.token || loginRes?.access_token;

        if (token) {
          await setToken(token);
          navigation.replace('Transactions');
          return;
        }
        // Si no viene token, cae al catch
        throw new Error('No se recibió token');
      } catch (e) {
        // Si el esquema del login exige más campos, te mando a Login
        Alert.alert('Registro completado', 'Ahora inicia sesión con tus credenciales.');
        navigation.replace('Login');
      }
    } catch (e) {
      Alert.alert('No se pudo registrar', e.message || 'Error de red');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#f9e26a', '#e99ebe']} style={{ flex:1 }}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex:1 }}>
        <ScrollView contentContainerStyle={{ flexGrow:1, justifyContent:'center', padding:16 }}>
          <View style={s.card}>
            <Text style={s.title}>Registro</Text>

            <Text style={s.label}>Nombre</Text>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="Juan"
            />

            <Text style={s.label}>Apellido</Text>
            <TextInput
              style={s.input}
              value={lastname}
              onChangeText={setLastname}
              placeholder="Pérez"
            />

            <Text style={s.label}>Correo electrónico</Text>
            <TextInput
              style={s.input}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="correo@example.com"
            />

            <Text style={s.label}>Teléfono (10 dígitos)</Text>
            <TextInput
              style={s.input}
              value={phone}
              onChangeText={(t) => setPhone(t.replace(/\D/g, ''))}
              keyboardType="number-pad"
              maxLength={10}
              placeholder="4421234567"
            />

            <Text style={s.label}>Contraseña</Text>
            <TextInput
              style={s.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="••••••••"
            />

            <Text style={s.label}>Confirmar contraseña</Text>
            <TextInput
              style={s.input}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry
              placeholder="••••••••"
            />

            <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Registrar</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={s.link}>¿Ya tienes una cuenta?</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  card:{ backgroundColor:'#fff', borderRadius:14, padding:20, alignSelf:'center', width:'92%', maxWidth:360 },
  title:{ fontSize:24, fontWeight:'800', textAlign:'center', color:'#7f5aa8', marginBottom:10 },
  label:{ marginTop:8, marginBottom:4, color:'#444' },
  input:{ backgroundColor:'#eee', borderRadius:8, height:40, paddingHorizontal:10 },
  btn:{ marginTop:14, backgroundColor:'#8e77c8', paddingVertical:12, borderRadius:10, alignItems:'center' },
  btnText:{ color:'#fff', fontWeight:'700' },
  link:{ marginTop:10, textAlign:'center', color:'#6f5ba8', textDecorationLine:'underline' }
});
