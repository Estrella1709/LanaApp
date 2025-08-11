// src/screens/DeleteTransactionScreen.js
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { deleteTransaction } from '../services/api';

export default function DeleteTransactionScreen({ navigation, route }) {
  const { id, type, amount } = route.params || {}; // id es necesario

  const confirm = () => {
    Alert.alert('¿Seguro que quieres eliminar esta transacción?', '', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          try {
            if (!id) throw new Error('Falta el id de la transacción');
            await deleteTransaction(id);
            // Si mandaste callback desde Transactions:
            route.params?.onDeleted?.(id);
            navigation.goBack();
          } catch (e) {
            Alert.alert('Error', e.message || 'No se pudo eliminar');
          }
        },
      },
    ]);
  };

  return (
    <LinearGradient colors={['#2c2c2e', '#1c1c1e']} style={{ flex:1 }}>
      <View style={s.header}>
        <Text style={s.headerTitle}>LanaApp - Transacciones</Text>
        <Ionicons name="settings-sharp" size={20} color="#cfe" />
      </View>

      <View style={s.card}>
        {/* Si quieres, puedes mostrar el tipo real según route.params.type */}
        <View style={s.row}>
          <MaterialIcons name={type === 'expense' ? 'arrow-downward' : 'arrow-upward'} size={20} color={type === 'expense' ? '#E76E6E' : '#3DBE7A'} />
          <Text style={[s.blockTitle,{ color: type === 'expense' ? '#E76E6E' : '#3DBE7A'}]}>
            {type === 'expense' ? 'Gasto' : 'Ingreso'}
          </Text>
          <View style={{flex:1}}/>
          <Text style={[s.amount,{ color: type === 'expense' ? '#E76E6E' : '#3DBE7A'}]}>
            {typeof amount === 'number' ? `$${amount.toFixed(2)}` : '$00.00'}
          </Text>
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
