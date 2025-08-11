/**
 * SetBudgetScreen
 * ---------------
 * Pantalla para listar y gestionar **presupuestos mensuales**.
 *
 * Flujo (demo con estado local):
 *  - Muestra una lista (FlatList) de presupuestos mock: { id, amount, month }.
 *  - FAB (+) abre modal para **Agregar** (monto + mes como texto).
 *  - Cada ítem tiene acciones de **Editar** (abre modal con valores precargados)
 *    y **Eliminar** (abre modal de confirmación).
 *
 * 🔌 Integración con API (marcado con // API: ...):
 *  1) Carga inicial:
 *     - Al montar, reemplazar el arreglo `budgets` por un fetch:
 *         GET /budgets        -> setBudgets(res) // [{id, amount, month}]
 *     - Manejar loading/errores (useState).
 *
 *  2) Agregar presupuesto:
 *     - En `onAdd` reemplazar el push en estado por:
 *         POST /budgets { amount:Number, month:String|YYYY-MM }
 *       y al éxito:
 *         a) Re-fetch (recomendado): volver a GET /budgets, o
 *         b) Agregar la respuesta al estado (si el server devuelve {id,...}).
 *
 *  3) Editar presupuesto:
 *     - En `onEdit` reemplazar map local por:
 *         PUT /budgets/:id { amount, month }
 *       y al éxito: re-fetch o actualizar el item en estado.
 *
 *  4) Eliminar presupuesto:
 *     - En `onDelete` reemplazar filter local por:
 *         DELETE /budgets/:id
 *       y al éxito: re-fetch o remover del estado.
 *
 *  5) UX/Data:
 *     - `month` ahora es un texto ("Mayo"). Para backend suele ser mejor **YYYY-MM**
 *       (ej. "2025-05"). Puedes guardar así en server y mostrar texto bonito en UI.
 *     - Validar que `amount` sea > 0 y que `month` no esté vacío antes de llamar la API.
 *
 *  6) Refresco al volver desde otras pantallas (si existieran):
 *     - Usa `useFocusEffect` o un evento para re-cargar GET /budgets cuando la screen enfoca.
 */

import { useState /*, useEffect */ } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function SetBudgetScreen() {
  /** Estado local con datos mock.
   *  // API: reemplazar por GET /budgets al montar:
   *  // useEffect(() => {
   *  //   (async () => {
   *  //     const res = await fetch(`${API_URL}/budgets`);
   *  //     const data = await res.json(); // [{id, amount, month}]
   *  //     setBudgets(data);
   *  //   })();
   *  // }, []);
   */
  const [budgets, setBudgets] = useState([
    { id: 'b1', amount: 0, month: 'Mayo' },
    { id: 'b2', amount: 0, month: 'Junio' },
    { id: 'b3', amount: 0, month: 'Julio' },
    { id: 'b4', amount: 0, month: 'Agosto' },
  ]);

  // Control de modales y formulario
  const [modalType, setModalType] = useState(null); // 'add' | 'edit' | 'delete'
  const [target, setTarget] = useState(null);       // presupuesto seleccionado en edit/delete
  const [amountInput, setAmountInput] = useState(''); // texto del input de monto
  const [monthInput, setMonthInput]   = useState(''); // texto del input de mes

  /** Abrir modal de AGREGAR (limpia formulario) */
  const openAdd = () => { setModalType('add'); setTarget(null); setAmountInput(''); setMonthInput(''); };

  /** Abrir modal de EDITAR (precarga con el item elegido) */
  const openEdit = (b) => { setModalType('edit'); setTarget(b); setAmountInput(String(b.amount || '')); setMonthInput(b.month || ''); };

  /** Abrir modal de ELIMINAR (solo confirmación) */
  const openDelete = (b) => { setModalType('delete'); setTarget(b); };

  /** Cerrar cualquier modal y limpiar */
  const closeModal = () => { setModalType(null); setTarget(null); setAmountInput(''); setMonthInput(''); };

  /** AGREGAR presupuesto (demo local)
   *  // API:
   *  // const onAdd = async () => {
   *  //   const amt = Number(amountInput); const month = monthInput.trim();
   *  //   if (!month || !(amt > 0)) return; // validar
   *  //   const res = await fetch(`${API_URL}/budgets`, {
   *  //     method:'POST', headers:{'Content-Type':'application/json'},
   *  //     body: JSON.stringify({ amount: amt, month: '2025-08' /* o month */ //})
     //   });
     //   const created = await res.json(); // { id, amount, month }
     //   setBudgets(prev => [...prev, created]); // o re-fetch
     //   closeModal();
     // };
   
  const onAdd = () => {
    const amt = parseFloat(amountInput || '0');
    const month = monthInput.trim();
    if (!month) return; // validación mínima
    setBudgets((prev) => [...prev, { id: `b${Date.now()}`, amount: isNaN(amt) ? 0 : amt, month }]);
    closeModal();
  };

  /** EDITAR presupuesto (demo local)
   *  // API:
   *  // const onEdit = async () => {
   *  //   if (!target) return;
   *  //   const amt = Number(amountInput); const month = monthInput.trim();
   *  //   if (!month || !(amt > 0)) return;
   *  //   const res = await fetch(`${API_URL}/budgets/${target.id}`, {
   *  //     method:'PUT', headers:{'Content-Type':'application/json'},
   *  //     body: JSON.stringify({ amount: amt, month })
   *  //   });
   *  //   const updated = await res.json();
   *  //   setBudgets(prev => prev.map(b => b.id === updated.id ? updated : b)); // o re-fetch
   *  //   closeModal();
   *  // };
   */
  const onEdit = () => {
    if (!target) return;
    const amt = parseFloat(amountInput || '0');
    const month = monthInput.trim();
    if (!month) return;
    setBudgets((prev) => prev.map((b) => (b.id === target.id ? { ...b, amount: isNaN(amt) ? 0 : amt, month } : b)));
    closeModal();
  };

  /** ELIMINAR presupuesto (demo local)
   *  // API:
   *  // const onDelete = async () => {
   *  //   if (!target) return;
   *  //   await fetch(`${API_URL}/budgets/${target.id}`, { method:'DELETE' });
   *  //   setBudgets(prev => prev.filter(b => b.id !== target.id)); // o re-fetch
   *  //   closeModal();
   *  // };
   */
  const onDelete = () => {
    if (!target) return;
    setBudgets((prev) => prev.filter((b) => b.id !== target.id));
    closeModal();
  };

  return (
    <LinearGradient colors={['#2c2c2e', '#1c1c1e']} style={{ flex: 1 }}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>LanaApp - Presupuestos</Text>
        <Ionicons name="settings-sharp" size={20} color="#cfe" />
      </View>

      {/* Lista de presupuestos */}
      <View style={s.card}>
        <FlatList
          data={budgets /* // API: budgets desde el servidor */}
          keyExtractor={(it) => it.id}
          renderItem={({ item }) => (
            <View style={{ paddingVertical:10 }}>
              <View style={s.row}>
                {/* Columna Monto */}
                <View style={{ flex:1 }}>
                  <Text style={s.label}>Monto:</Text>
                  {/* // API: formatear moneda según locale, ej. Intl.NumberFormat */}
                  <Text style={s.amount}>${Number(item.amount).toFixed(2)}</Text>
                </View>

                {/* Columna Mes */}
                <View style={{ flex:1 }}>
                  <Text style={s.label}>Mes:</Text>
                  {/* // API: si guardas YYYY-MM, convierte a nombre legible aquí */}
                  <Text style={s.month}>{item.month}</Text>
                </View>

                {/* Acciones */}
                <View style={s.actions}>
                  <TouchableOpacity style={[s.iconBtn, { backgroundColor: '#F5A524' }]} onPress={() => openEdit(item)}>
                    <MaterialIcons name="edit" size={16} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={[s.iconBtn, { backgroundColor: '#F08AB2' }]} onPress={() => openDelete(item)}>
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
      </View>

      {/* FAB (+) para agregar */}
      <View style={s.fabContainer}>
        <TouchableOpacity style={s.fab} onPress={openAdd} activeOpacity={0.9}>
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* MODAL: Agregar */}
      <Modal visible={modalType === 'add'} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={s.backdrop}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Monto de presupuesto:</Text>
            {/* Monto (string -> number en onAdd) */}
            <TextInput
              value={amountInput}
              onChangeText={setAmountInput}
              keyboardType="numeric"
              placeholder="$00.00"
              placeholderTextColor="#bfbfbf"
              style={s.input}
            />
            <Text style={[s.modalTitle, { marginTop: 10 }]}>Mes de presupuesto:</Text>
            {/* Mes (texto libre en demo). 
                // API: considera usar picker de mes (YYYY-MM) para evitar errores */}
            <TextInput
              value={monthInput}
              onChangeText={setMonthInput}
              placeholder="Ej. Agosto"
              placeholderTextColor="#bfbfbf"
              style={s.input}
            />
            <View style={s.modalActions}>
              <TouchableOpacity style={[s.modalBtn, s.btnCancel]} onPress={closeModal}>
                <Text style={s.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, s.btnAdd]} onPress={onAdd /* API: usar versión async de arriba */}>
                <Text style={s.btnAddText}>Agregar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: Editar */}
      <Modal visible={modalType === 'edit'} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={s.backdrop}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>¿Seguro que quieres editar este presupuesto?</Text>
            <TextInput
              value={amountInput}
              onChangeText={setAmountInput}
              keyboardType="numeric"
              placeholder="Monto"
              placeholderTextColor="#bfbfbf"
              style={s.input}
            />
            <TextInput
              value={monthInput}
              onChangeText={setMonthInput}
              placeholder="Mes"
              placeholderTextColor="#bfbfbf"
              style={s.input}
            />
            <View style={s.modalActions}>
              <TouchableOpacity style={[s.modalBtn, s.btnCancel]} onPress={closeModal}>
                <Text style={s.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, s.btnEdit]} onPress={onEdit /* API: usar versión async */}>
                <Text style={s.btnEditText}>Editar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: Eliminar */}
      <Modal visible={modalType === 'delete'} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={s.backdrop}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>¿Seguro que quieres eliminar este presupuesto?</Text>
            <View style={s.modalActions}>
              <TouchableOpacity style={[s.modalBtn, s.btnCancel]} onPress={closeModal}>
                <Text style={s.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, s.btnDelete]} onPress={onDelete /* API: usar DELETE real */}>
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
  amount:{ color:'#fff', fontSize:18, fontWeight:'800' },
  month:{ color:'#fff', fontSize:18, fontWeight:'800' },

  actions:{ flexDirection:'row', gap:10, marginLeft:8 },
  iconBtn:{ width:28, height:28, borderRadius:14, alignItems:'center', justifyContent:'center' },
  divider:{ height:1, backgroundColor:'#cfaed3', opacity:0.35 },

  fabContainer:{ position:'absolute', right:16, bottom:22, alignItems:'center' },
  fab:{ width:56, height:56, borderRadius:28, backgroundColor:'#8AA2FF', justifyContent:'center', alignItems:'center', elevation:6 },

  backdrop:{ flex:1, backgroundColor:'rgba(0,0,0,0.45)', justifyContent:'center', alignItems:'center' },
  modalBox:{ width:280, borderRadius:12, borderWidth:1, borderColor:'#f0b6d6', backgroundColor:'rgba(40,40,42,0.98)', padding:16 },
  modalTitle:{ color:'#fff', fontWeight:'700', marginBottom:12, textAlign:'center' },
  input:{ backgroundColor:'#2f2f31', color:'#fff', borderRadius:8, height:40, paddingHorizontal:10, marginBottom:12, borderWidth:1, borderColor:'#cfaed3' },
  modalActions:{ flexDirection:'row', justifyContent:'space-between' },
  modalBtn:{ borderRadius:8, paddingVertical:8, paddingHorizontal:18 },

  btnCancel:{ backgroundColor:'#cfaed3' },  btnCancelText:{ color:'#2b2b2e', fontWeight:'700' },
  btnAdd:{ backgroundColor:'#9BE89B' },     btnAddText:{ color:'#2b2b2e', fontWeight:'700' },
  btnEdit:{ backgroundColor:'#F5A524' },    btnEditText:{ color:'#2b2b2e', fontWeight:'700' },
  btnDelete:{ backgroundColor:'#E5484D' },  btnDeleteText:{ color:'#fff', fontWeight:'700' },
});
