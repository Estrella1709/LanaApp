/**
 * FixedPaymentsScreen
 * -------------------
 * Pantalla para listar y gestionar Pagos Fijos (rentas, servicios, etc.).
 *
 * Qué hace (demo con estado local):
 *  - Muestra una lista (FlatList) de pagos fijos mock (id, category, amount, date).
 *  - Botón editar por item -> navega a AddEditFixedPayment en modo 'edit'.
 *  - Botón eliminar por item -> abre modal de confirmación y elimina del estado local.
 *  - FAB (+) -> navega a AddEditFixedPayment en modo 'add'.
 *
 * 🔌 Integración con API (marcado con // API: ...):
 *  1) Carga inicial:
 *     - Al montar la pantalla, reemplazar el estado mock con un fetch:
 *       GET /fixed-payments  ->  setPayments(res)
 *       (Usa useEffect y maneja loading/errores)
 *
 *  2) Agregar/Editar:
 *     - En vez de callbacks locales (onSave) desde la Screen AddEditFixedPayment,
 *       haz POST/PUT en esa screen y regresa aquí con navigation.goBack().
 *       Aquí puedes:
 *         a) Re-fetch (recomendado): volver a GET /fixed-payments en useFocusEffect
 *         b) O actualizar el estado local con el elemento creado/editado (como ahora)
 *
 *  3) Eliminar:
 *     - Reemplazar deletePayment() por:
 *         await DELETE /fixed-payments/:id
 *         y luego refrescar lista (re-fetch o filter en estado).
 *
 *  4) Fechas y montos:
 *     - Si la API envía date como string (ISO), parsear a Date al render o guardar como string
 *       y formatear con una lib (date-fns/dayjs) para mostrar.
 */

import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function FixedPaymentsScreen({ navigation }) {
  /** Estado local (demo).
   *  // API: reemplazar por GET /fixed-payments al montar la pantalla.
   *  // useEffect(() => { fetch(...).then(setPayments) }, []);
   */
  const [payments, setPayments] = useState([
    { id: 'p1', category: 'Renta',     amount: 0, date: new Date() },
    { id: 'p2', category: 'Internet',  amount: 0, date: new Date() },
    { id: 'p3', category: 'Despensa',  amount: 0, date: new Date() },
  ]);

  /** Control del modal de confirmación para eliminar */
  const [confirmDelete, setConfirmDelete] = useState(null);

  /** Agregar: navega a la screen de Add/Edit (modo add).
   *  DEMO: usamos onSave para actualizar estado local.
   *  // API: en AddEditFixedPayment haz POST /fixed-payments y al volver,
   *  // aquí haz un re-fetch (useFocusEffect) o recibe el nuevo item por params.
   */
  const openAdd = () => navigation.navigate('AddEditFixedPayment', {
    mode: 'add',
    onSave: (p) => setPayments((prev) => [...prev, p]), // ← demo local
  });

  /** Editar: navega con el item (modo edit).
   *  DEMO: onSave hace map en estado local.
   *  // API: en AddEditFixedPayment haz PUT /fixed-payments/:id y al volver,
   *  // re-fetch aquí o actualiza el estado con el resultado devuelto.
   */
  const openEdit = (payment) => navigation.navigate('AddEditFixedPayment', {
    mode: 'edit',
    payment,
    onSave: (p) => setPayments((prev) => prev.map((x) => (x.id === p.id ? p : x))), // ← demo local
  });

  /** Eliminar (demo local).
   *  // API: reemplazar por:
   *  //   await fetch(`${API_URL}/fixed-payments/${confirmDelete.id}`, { method:'DELETE' })
   *  //   y luego re-fetch o filter en estado.
   */
  const deletePayment = () => {
    if (!confirmDelete) return;
    setPayments((prev) => prev.filter((x) => x.id !== confirmDelete.id));
    setConfirmDelete(null);
  };

  return (
    <LinearGradient colors={['#2c2c2e', '#1c1c1e']} style={{ flex: 1 }}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>LanaApp - Pagos fijos</Text>
        <Ionicons name="settings-sharp" size={20} color="#cfe" />
      </View>

      {/* Lista */}
      <View style={s.card}>
        <FlatList
          data={payments}
          keyExtractor={(it) => it.id}
          renderItem={({ item }) => (
            <View style={{ paddingVertical: 10 }}>
              <View style={s.row}>
                <Text style={s.cat}>{item.category}</Text>
                <View style={s.actions}>
                  {/* Editar */}
                  <TouchableOpacity
                    style={[s.iconBtn, { backgroundColor: '#F5A524' }]}
                    onPress={() => openEdit(item)}
                  >
                    <MaterialIcons name="edit" size={16} color="#fff" />
                  </TouchableOpacity>

                  {/* Eliminar */}
                  <TouchableOpacity
                    style={[s.iconBtn, { backgroundColor: '#F08AB2' }]}
                    onPress={() => setConfirmDelete(item)}
                  >
                    <MaterialIcons name="delete" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Detalles del pago fijo
                 // API: formatea amount según tu moneda y date según tu locale. */}
              <Text style={s.label}>Monto:</Text>
              <Text style={s.amount}>${item.amount.toFixed(2)}</Text>
              <Text style={s.label}>Fecha:  {item.date.toLocaleDateString()}</Text>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={s.divider} />}
          contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 4, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        />
      </View>

      {/* FAB (+) */}
      <View style={s.fabContainer}>
        <TouchableOpacity style={s.fab} onPress={openAdd} activeOpacity={0.9}>
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Modal de confirmación para eliminar */}
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
              <TouchableOpacity style={[s.modalBtn, s.btnDelete]} onPress={deletePayment /* API: usar DELETE real */}>
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
