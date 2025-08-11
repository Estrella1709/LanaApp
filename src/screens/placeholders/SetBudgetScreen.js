import { useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  FlatList, Alert, ActivityIndicator
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { listBudgets, deleteBudget, getCategoriesApi } from '../../services/api';

export default function SetBudgetScreen() {
  const navigation = useNavigation();
  const [budgets, setBudgets] = useState([]); // [{id, amount, month(1..12), category}]
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [confirmDelete, setConfirmDelete] = useState(null);

  const idToName = useMemo(() => {
    const m = new Map();
    categories.forEach(c => m.set(
      c.id ?? c.ID ?? c.Id ?? c.id_category ?? c.idCategory,
      c.name ?? c.Nombre ?? c.nombre ?? 'Categoría'
    ));
    return m;
  }, [categories]);

  const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
  const monthLabel = (m) => MONTHS[(Number(m)||1)-1] || String(m);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [bRes, cRes] = await Promise.all([listBudgets(), getCategoriesApi()]);
      const normB = Array.isArray(bRes) ? bRes.map(b => ({
        id: b.id ?? b.ID ?? b.Id,
        amount: Number(b.amount)||0,
        month: Number(b.month)||1,
        category: b.category
      })) : [];
      setBudgets(normB);
      setCategories(Array.isArray(cRes) ? cRes : []);
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudieron cargar los presupuestos');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const remove = async () => {
    if (!confirmDelete) return;
    try {
      setLoading(true);
      await deleteBudget(confirmDelete.id);
      setConfirmDelete(null);
      await load();
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo eliminar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#2c2c2e', '#1c1c1e']} style={{ flex: 1 }}>
      <View style={s.header}>
        <Text style={s.headerTitle}>LanaApp - Presupuestos</Text>
        <Ionicons name="settings-sharp" size={20} color="#cfe" />
      </View>

      <View style={s.card}>
        {loading && budgets.length === 0 ? (
          <View style={{ paddingVertical: 30, alignItems:'center' }}>
            <ActivityIndicator />
            <Text style={{ color:'#ccc', marginTop:8 }}>Cargando…</Text>
          </View>
        ) : (
          <FlatList
            data={budgets}
            keyExtractor={(it) => String(it.id)}
            renderItem={({ item }) => (
              <View style={{ paddingVertical:10 }}>
                <View style={s.row}>
                  <View style={{ flex:1 }}>
                    <Text style={s.label}>Monto:</Text>
                    <Text style={s.amount}>${Number(item.amount).toFixed(2)}</Text>
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={s.label}>Mes:</Text>
                    <Text style={s.amount}>{monthLabel(item.month)}</Text>
                  </View>
                  <View style={{ flex:1 }}>
                    <Text style={s.label}>Categoría:</Text>
                    <Text style={s.amount}>
                      {idToName.get(item.category) ?? `Cat ${item.category}`}
                    </Text>
                  </View>

                  <View style={s.actions}>
                    <TouchableOpacity
                      style={[s.iconBtn, { backgroundColor: '#F5A524' }]}
                      onPress={() => navigation.navigate('AddEditBudget', { mode:'edit', budget:item })}
                    >
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
              </View>
            )}
            ItemSeparatorComponent={() => <View style={s.divider} />}
            contentContainerStyle={{ paddingVertical:10, paddingHorizontal:4, paddingBottom:100 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* FAB */}
      <View style={s.fabContainer}>
        <TouchableOpacity
          style={s.fab}
          onPress={() => navigation.navigate('AddEditBudget', { mode:'add' })}
          activeOpacity={0.9}
        >
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Confirm delete */}
      <Modal visible={!!confirmDelete} transparent animationType="fade" onRequestClose={() => setConfirmDelete(null)}>
        <View style={s.backdrop}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>¿Eliminar este presupuesto?</Text>
            <View style={s.modalActions}>
              <TouchableOpacity style={[s.modalBtn, s.btnCancel]} onPress={() => setConfirmDelete(null)}>
                <Text style={s.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, s.btnDelete]} onPress={remove}>
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
  header:{ paddingTop:18, paddingHorizontal:14, paddingBottom:8, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  headerTitle:{ color:'#fff', fontSize:16, fontWeight:'700' },

  card:{ margin:14, borderWidth:1, borderColor:'#f0b6d6', borderRadius:14, paddingVertical:10, paddingHorizontal:12, backgroundColor:'rgba(255,255,255,0.06)' },

  row:{ flexDirection:'row', alignItems:'center' },
  label:{ color:'#bfbfbf', fontWeight:'700' },
  amount:{ color:'#fff', fontSize:16, fontWeight:'800' },

  actions:{ flexDirection:'row', gap:10, marginLeft:8 },
  iconBtn:{ width:28, height:28, borderRadius:14, alignItems:'center', justifyContent:'center' },
  divider:{ height:1, backgroundColor:'#cfaed3', opacity:0.35 },

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
