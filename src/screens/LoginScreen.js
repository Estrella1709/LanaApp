/**
 * LoginScreen
 * -----------
 * Pantalla de inicio de sesión.
 *
 * Flujo:
 *  - Renderiza un formulario básico (email y contraseña) dentro de un Gradient.
 *  - Usa KeyboardAvoidingView + ScrollView para que el teclado no tape los inputs
 *    y se pueda hacer scroll en pantallas chicas.
 *  - Botón "Iniciar": por ahora navega directo a 'Transactions' (placeholder).
 *
 * Integración con API (dónde va):
 *  - En el onPress del botón "Iniciar" (ver comentario // API: ...),
 *    ahí debes:
 *      1) Validar email/contraseña.
 *      2) Hacer POST a tu endpoint (p. ej. /auth/login).
 *      3) Manejar loading/errores.
 *      4) Guardar token/usuario (AsyncStorage/SecureStore).
 *      5) Navegar a 'Transactions' SOLO si la API devuelve éxito.
 *
 * Sugerencia mínima para la integración:
 *  - Agrega estados locales: const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
 *  - Crea un handler handleLogin con try/catch que haga el fetch/axios y setee loading.
 *  - Reemplaza navigation.replace('Transactions') por handleLogin().
 */

import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, ScrollView, Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen({ navigation }) {
  return (
    // Fondo con degradado (estético)
    <LinearGradient colors={['#f9e26a', '#e99ebe']} style={{ flex:1 }}>

      {/* Levanta el contenido cuando aparece el teclado (iOS) */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex:1 }}
      >

        {/* Scroll para que nunca se corte el formulario en pantallas pequeñas */}
        <ScrollView contentContainerStyle={{ flexGrow:1, justifyContent:'center', padding:16 }}>

          {/* Tarjeta del formulario */}
          <View style={s.card}>
            <Text style={s.title}>Inicio Sesión</Text>

            {/* EMAIL
               API: al integrar, bindea value y onChangeText a un estado: email / setEmail
               Recomendado: autoCapitalize="none", keyboardType="email-address"
            */}
            <Text style={s.label}>Correo electrónico</Text>
            <TextInput style={s.input} />

            {/* PASSWORD
               API: bindea a password / setPassword
               secureTextEntry ya oculta el texto en pantalla
            */}
            <Text style={s.label}>Contraseña</Text>
            <TextInput style={s.input} secureTextEntry />

            {/* BOTÓN INICIAR
               API: aquí va la llamada real. Reemplazar por handleLogin().
               Ejemplo (pseudocódigo):
                 onPress={async () => {
                   // 1) Validar campos
                   // if (!email || !password) { mostrar error; return; }

                   // 2) Llamar API
                   // try {
                   //   setLoading(true);
                   //   const res = await fetch(`${API_URL}/auth/login`, {
                   //     method: 'POST',
                   //     headers: { 'Content-Type': 'application/json' },
                   //     body: JSON.stringify({ email, password })
                   //   });
                   //   if (!res.ok) throw new Error('Credenciales inválidas');
                   //   const data = await res.json(); // { token, user }
                   //
                   //   // 3) Guardar sesión (ej. AsyncStorage/SecureStore)
                   //   // await AsyncStorage.setItem('token', data.token);
                   //
                   //   // 4) Navegar
                   //   navigation.replace('Transactions');
                   // } catch (e) {
                   //   // mostrar error en UI
                   // } finally {
                   //   setLoading(false);
                   // }
                 }}
            */}
            <TouchableOpacity
              style={s.btn}
              onPress={() => navigation.replace('Transactions')} // <-- Placeholder temporal
            >
              <Text style={s.btnText}>Iniciar</Text>
            </TouchableOpacity>

            {/* Link a registro (navegación simple) */}
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
  // Contenedor visual de la tarjeta/formulario
  card:{
    backgroundColor:'#fff',
    borderRadius:14,
    padding:20,
    alignSelf:'center',
    width:'92%',
    maxWidth:360,
    shadowOpacity:0.2,
    shadowRadius:10
  },
  title:{ fontSize:24, fontWeight:'800', textAlign:'center', color:'#7f5aa8', marginBottom:10 },

  // Etiquetas e inputs
  label:{ marginTop:8, marginBottom:4, color:'#444' },
  input:{ backgroundColor:'#eee', borderRadius:8, height:40, paddingHorizontal:10 },

  // Botón de acción principal
  btn:{ marginTop:14, backgroundColor:'#8e77c8', paddingVertical:12, borderRadius:10, alignItems:'center' },
  btnText:{ color:'#fff', fontWeight:'700' },

  // Navegación a registro
  link:{ marginTop:10, textAlign:'center', color:'#6f5ba8', textDecorationLine:'underline' }
});
