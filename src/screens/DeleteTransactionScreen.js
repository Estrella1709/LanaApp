/**
 * DeleteTransactionScreen
 * -----------------------
 * Pantalla para confirmar la eliminación de una transacción.
 *
 * Flujo actual (demo):
 *  - Muestra dos bloques estéticos (Ingreso y Gasto) con botón "Eliminar" que
 *    lanza un Alert nativo para confirmar. Al confirmar, hace goBack().
 *
 * Integración con API (marcado con // API: ...):
 *  1) Recibir por route.params el ID (y opcionalmente tipo, monto, fecha) de la transacción a borrar.
 *     Ej.: navigation.navigate('DeleteTransaction', { id: 't1', type: 'income', amount: 250 })
 *  2) En confirm(), reemplazar el goBack() por:
 *        await DELETE /transactions/:id
 *        si OK -> refrescar lista en TransactionsScreen (callback o evento) y goBack()
 *  3) Mostrar datos reales (monto/tipo) en la UI usando route.params.
 *
 * Nota UX:
 *  - Si prefieres evitar navegar a otra screen, puedes usar un Modal en la misma
 *    TransactionsScreen. El patrón de screen separada también es válido si quieres
 *    un flujo dedicado.
 */

import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function DeleteTransactionScreen({ navigation, route }) {
  // API: datos reales que podría mandar TransactionsScreen
  // const { id, type, amount } = route.params || {};

  const confirm = () => {
    Alert.alert('¿Seguro que quieres eliminar esta transacción?', '', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          /* API: eliminar en servidor
           try {
             const res = await fetch(`${API_URL}/transactions/${id}`, { method: 'DELETE' });
             if (!res.ok) throw new Error('No se pudo eliminar');

             // Opciones para refrescar:
             // 1) Navegar atrás y que TransactionsScreen use useFocusEffect para recargar
             // 2) Pasar un callback en params y llamarlo aquí:
             //    route.params?.onDeleted?.(id);

             navigation.goBack();
           } catch (e) {
             Alert.alert('Error', e.message || 'No se pudo eliminar');
           }
          */
          navigation.goBack(); // ← demo actual
        },
      },
    ]);
  };

  return (
    <LinearGradient colors={['#2c2c2e', '#1c1c1e']} style={{ flex:1 }}>
      {/* Header simple */}
      <View style={s.header}>
        <Text style={s.headerTitle}>LanaApp - Transacciones</Text>
        <Ionicons name="settings-sharp" size={20} color="#cfe" />
      </View>

      {/* Card de confirmación (vista doble ingreso/gasto, puramente estética en el mock) */}
      <View style={s.card}>
        {/* Bloque Ingresos (ejemplo visual). 
            API: si solo borras una transacción específica, puedes mostrar su tipo real:
            if (type === 'income') ... */}
        <View style={s.row}>
          <MaterialIcons name="arrow-upward" size={20} color="#3DBE7A" />
          <Text style={[s.blockTitle,{ color:'#3DBE7A'}]}>Ingresos</Text>
          <View style={{flex:1}}/>
          {/* API: usa amount real si aplica: <Text style={[s.amount,{ color:'#3DBE7A'}]}>${Number(amount).toFixed(2)}</Text> */}
          <Text style={[s.amount,{ color:'#3DBE7A'}]}>$00.00</Text>
        </View>
        <TouchableOpacity style={[s.btn, { backgroundColor:'#E5484D' }]} onPress={confirm}>
          <Text style={s.btnText}>Eliminar</Text>
        </TouchableOpacity>

        <View style={{ height:12 }} />

        {/* Bloque Gastos (ejemplo visual).
            API: si la transacción a borrar es de gasto, podrías ocultar el de ingresos y mostrar solo este. */}
        <View style={s.row}>
          <MaterialIcons name="arrow-downward" size={20} color="#E76E6E" />
          <Text style={[s.blockTitle,{ color:'#E76E6E'}]}>Gastos</Text>
          <View style={{flex:1}}/>
          <Text style={[s.amount,{ color:'#E76E6E'}]}>$00.00</Text>
        </View>
        <TouchableOpacity style={[s.btn, { backgroundColor:'#E5484D' }]} onPress={confirm}>
          <Text style={s.btnText}>Eliminar</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  header:{ paddingTop:18,paddingHorizontal:14,paddingBottom:8, flexDirection:'row',justifyContent:'space-between',alignItems:'center' },
  headerTitle:{ color:'#fff', fontSize:16, fontWeight:'700' },

  card:{ margin:14, borderWidth:1, borderColor:'#f0b6d6', borderRadius:14, padding:16, backgroundColor:'rgba(255,255,255,0.06)' },

  row:{ flexDirection:'row', alignItems:'center', gap:6, marginTop:4 },
  blockTitle:{ fontSize:18, fontWeight:'700' },
  amount:{ fontWeight:'700' },

  btn:{ alignSelf:'flex-start', paddingVertical:8, paddingHorizontal:16, borderRadius:8, marginTop:10 },
  btnText:{ color:'#fff', fontWeight:'700' },
});
