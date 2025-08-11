import 'react-native-gesture-handler';
import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, Alert, ActivityIndicator
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

import {
  listFixedPayments,
  deleteFixedPayment,
  apiFetch, 
} from '../../services/api';

export default function FixedPaymentsScreen({ navigation }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading]   = useState(false);

  // categorías para mostrar nombre en vez de id
  const [categories, setCategories] = useState([]);
  const idToName = useMemo(() => {
    const m = new Map();
    categories.forEach(c => m.set(
      c.id ?? c.ID ?? c.Id ?? c.id_category ?? c.idCategory,
      c.name ?? c.Nombre ?? c.nombre ?? 'Sin nombre'
    ));
    return m;
  }, [categories]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      // pagos fijos
      const rows = await listFixedPayments(); // [{id, amount, day, time, description, category}]
      setPayments(Array.isArray(rows) ? rows : []);

      // categorías
      try {
        const cats = await apiFetch('/categories/');
        if (Array.isArray(cats) && cats.length) setCategories(cats);
      } catch { /* fallback vacío */ }
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudieron cargar los pagos fijos');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const [confirmDelete, setConfirmDelete] = useState(null);

  const doDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteFixedPayment(confirmDelete.id);
      setConfirmDelete(null);
      load();
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo eliminar');
    }
  };

  const openAdd = () => {
    navigation.navigate('AddEditFixedPayment', { mode: 'add' });
  };
  const openEdit = (payment) => {
    navigation.navigate('AddEditFixedPayment', { mode: 'edit', payment });
  };

  const renderItem = ({ item }) => {
    // reconstruimos fecha para mostrarla (día + mes/año actuales)
    const now = new Date();
    const displayDate = new Date(now.getFullYear(), now.getMonth(), Number(item.day) || 1);
    const catName = idToName.get(item.category) ?? `Cat ${item.category}`;

    return (
      <View style={{ paddingVertical: 10 }}>
        <View style={s.row}>
          <Text style={s.cat}>{catName}</Text>
          <View style={s.actions}>
            <TouchableOpacity style={[s.iconBtn, { backgroundColor: '#F5A524' }]} onPress={() => openEdit(item)}>
              <MaterialIcons name="edit" size={16} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.iconBtn, { backgroundColor: '#F08AB2' }]}
              onPress={() => setConfirmDelete(item)}
            >
              <MaterialIcons name="delete" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={s.label}>Monto:</Text>
        <Text style={s.amount}>${Number(item.amount || 0).toFixed(2)}</Text>
        <Text style={s.label}>Fecha: {displayDate.toLocaleDateString()}</Text>
        {!!item.description && <Text style={[s.label, { marginTop: 6 }]}>Nota: <Text style={{color:'#fff'}}>{item.description}</Text></Text>}
      </View>
    );
  };

  return (
    <LinearGradient colors={['#2c2c2e', '#1c1c1e']} style={{ flex: 1 }}>
      <View style={s.header}>
        <Text style={s.headerTitle}>LanaApp - Pagos fijos</Text>
        <Ionicons name="settings-sharp" size={20} color="#cfe" />
      </View>

      <View style={s.card}>
        {loading && payments.length === 0 ? (
          <View style={{ paddingVertical: 30, alignItems: 'center' }}>
            <ActivityIndicator />
            <Text style={{ color:'#ccc', marginTop:8 }}>Cargando…</Text>
          </View>
        ) : (
          <FlatList
            data={payments}
            keyExtractor={(it) => String(it.id)}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={s.divider} />}
            contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 4, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      <View style={s.fabContainer}>
        <TouchableOpacity style={s.fab} onPress={openAdd} activeOpacity={0.9}>
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Confirm delete */}
      <Modal
        visible={!!confirmDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDelete(null)}
      >
        <View style={s.backdrop}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>¿Seguro que quieres eliminar este pago fijo?</Text>
            <View style={s.modalActions}>
              <TouchableOpacity style={[s.modalBtn, s.btnCancel]} onPress={() => setConfirmDelete(null)}>
                <Text style={s.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, s.btnDelete]} onPress={doDelete}>
                <Text style={s.btnDeleteText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const s = StyleSheet.create({
  header:{ paddingTop:18,paddingHorizontal:14,paddingBottom:8, flexDirection:'row',justifyContent:'space-between',alignItems:'center' },
  headerTitle:{ color:'#fff', fontSize:16, fontWeight:'700' },

  card:{ margin:14, borderWidth:1, borderColor:'#f0b6d6', borderRadius:14, paddingVertical:10, paddingHorizontal:12, backgroundColor:'rgba(255,255,255,0.06)' },

  row:{ flexDirection:'row', alignItems:'center' },
  cat:{ color:'#fff', fontSize:18, fontWeight:'700', flex:1 },

  actions:{ flexDirection:'row', gap:10 },
  iconBtn:{ width:28, height:28, borderRadius:14, alignItems:'center', justifyContent:'center' },

  label:{ color:'#bfbfbf', marginTop:6, fontWeight:'700' },
  amount:{ color:'#fff', fontSize:18, fontWeight:'800' },

  divider:{ height:1, backgroundColor:'#cfaed3', opacity:0.35, marginTop:10 },

  fabContainer:{ position:'absolute', right:16, bottom:22, alignItems:'center' },
  fab:{ width:56, height:56, borderRadius:28, backgroundColor:'#8AA2FF', justifyContent:'center', alignItems:'center', elevation:6 },

  backdrop:{ flex:1, backgroundColor:'rgba(0,0,0,0.45)', justifyContent:'center', alignItems:'center' },
  modalBox:{ width:280, borderRadius:12, borderWidth:1, borderColor:'#f0b6d6', backgroundColor:'rgba(40,40,42,0.98)', padding:16 },
  modalTitle:{ color:'#fff', fontWeight:'700', marginBottom:12, textAlign:'center' },
  modalActions:{ flexDirection:'row', justifyContent:'space-between' },
  modalBtn:{ borderRadius:8, paddingVertical:8, paddingHorizontal:18 },

  btnCancel:{ backgroundColor:'#cfaed3' }, btnCancelText:{ color:'#2b2b2e', fontWeight:'700' },
  btnDelete:{ backgroundColor:'#E5484D' }, btnDeleteText:{ color:'#fff', fontWeight:'700' },
});
