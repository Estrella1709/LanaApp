/**
 * RegisterScreen
 * --------------
 * Pantalla de registro de usuario.
 *
 * Flujo:
 *  - Renderiza un formulario con: nombre, email, password y confirmación.
 *  - Usa KeyboardAvoidingView + ScrollView para evitar que el teclado tape los campos y permitir scroll.
 *  - Botón "Registrar": actualmente navega directo a 'Transactions' (placeholder).
 *
 * Integración con API (marcado abajo):
 *  - En el onPress del botón "Registrar", reemplaza la navegación directa por un handler que:
 *      1) Valide inputs (campos vacíos y password === confirmPassword).
 *      2) Haga POST al endpoint (p. ej. POST /auth/register).
 *      3) Maneje loading/errores.
 *      4) (Opcional) Guarde token/usuario (SecureStore/AsyncStorage) si la API lo retorna.
 *      5) Navegue a 'Login' o 'Transactions' según tu flujo (común: ir a Login).
 *
 * Sugerencias de implementación (cuando conectes backend):
 *  - Añade estados: name/email/password/confirmPassword + loading + error.
 *  - Crea un handleRegister async con try/catch (fetch/axios).
 *  - Deshabilita el botón mientras loading.
 *  - Muestra mensajes de error debajo del botón si algo falla.
 */

import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, ScrollView, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function RegisterScreen({ navigation }) {
  return (
    // Fondo con degradado acorde al diseño general
    <LinearGradient colors={['#f9e26a', '#e99ebe']} style={{ flex:1 }}>
      {/* Evita solape con teclado en iOS */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex:1 }}>
        {/* Permite scrollear si el contenido crece (pantallas pequeñas/teclado abierto) */}
        <ScrollView contentContainerStyle={{ flexGrow:1, justifyContent:'center', padding:16 }}>
          {/* Tarjeta del formulario */}
          <View style={s.card}>
            <Text style={s.title}>Registro</Text>

            {/* NOMBRE
               API: al integrar, usa estado local (value/onChangeText) -> name/setName
            */}
            <Text style={s.label}>Nombre completo</Text>
            <TextInput style={s.input} />

            {/* EMAIL
               API: bindea a email/setEmail
               Recomendado: autoCapitalize="none", keyboardType="email-address"
            */}
            <Text style={s.label}>Correo electrónico</Text>
            <TextInput style={s.input} />

            {/* PASSWORD
               API: bindea a password/setPassword
            */}
            <Text style={s.label}>Contraseña</Text>
            <TextInput style={s.input} secureTextEntry />

            {/* CONFIRM PASSWORD
               API: bindea a confirmPassword/setConfirmPassword
               Valida que coincida con password antes de llamar la API.
            */}
            <Text style={s.label}>Confirmar contraseña</Text>
            <TextInput style={s.input} secureTextEntry />

            {/* BOTÓN REGISTRAR
               API: reemplazar navigation.replace(...) por un handler handleRegister():
               -----------------------------------------------------------
               onPress={async () => {
                 // 1) Validación
                 // if (!name || !email || !password || !confirmPassword) { setError('Completa todos los campos'); return; }
                 // if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }

                 // 2) Llamada a API (ajusta URL y payload)
                 // try {
                 //   setLoading(true);
                 //   const res = await fetch(`${API_URL}/auth/register`, {
                 //     method: 'POST',
                 //     headers: { 'Content-Type': 'application/json' },
                 //     body: JSON.stringify({ name, email, password })
                 //   });
                 //   if (!res.ok) {
                 //     const err = await res.json().catch(()=>null);
                 //     throw new Error(err?.message || 'No se pudo registrar');
                 //   }
                 //   const data = await res.json(); // { token?, user? }
                 //
                 //   // 3) (Opcional) guardar token si tu API lo manda tras registro
                 //   // await SecureStore.setItemAsync('auth_token', data.token);
                 //
                 //   // 4) Navegación post-registro:
                 //   // Común: ir a Login para que el usuario inicie sesión:
                 //   navigation.replace('Login');
                 //   // O si tu API ya inicia sesión: navigation.replace('Transactions');
                 // } catch (e) {
                 //   setError(e.message || 'Error de red');
                 // } finally {
                 //   setLoading(false);
                 // }
               }}
               -----------------------------------------------------------
            */}
            <TouchableOpacity style={s.btn} onPress={() => navigation.replace('Transactions') /* <-- Placeholder temporal */}>
              <Text style={s.btnText}>Registrar</Text>
            </TouchableOpacity>

            {/* Link para volver a Login */}
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
