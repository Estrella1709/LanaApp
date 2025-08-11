/**
 * CategoriesScreen
 * ----------------
 * Pantalla para listar y gestionar categorías (agregar, editar, eliminar).
 *
 * Flujo actual (demo con estado local):
 *  - Muestra una lista (FlatList) de categorías mock en estado local.
 *  - FAB (+) abre modal para AGREGAR.
 *  - Botón "edit" abre modal para EDITAR (pre-carga el nombre en el input).
 *  - Botón "delete" abre modal para ELIMINAR (confirmación simple).
 *
 * 🔌 Integración con API (marcado con // API: ...):
 *  1) Cargar categorías al entrar:
 *     - useEffect(() => { GET /categories; setCategories(res); }, []);
 *     - Opcional: paginación / búsqueda por nombre.
 *
 *  2) Agregar categoría:
 *     - POST /categories  { name }
 *     - Al éxito: actualizar lista (push a estado o re-fetch).
 *
 *  3) Editar categoría:
 *     - PUT/PATCH /categories/:id  { name }
 *     - Al éxito: actualizar lista (map) o re-fetch.
 *
 *  4) Eliminar categoría:
 *     - DELETE /categories/:id
 *     - Al éxito: actualizar lista (filter) o re-fetch.
 *
 * UX:
 *  - Los tres modales comparten el mismo input (solo se usa en add/edit).
 *  - contentContainerStyle deja espacio para que el FAB no tape el último ítem.
 */

import { useState /*, useEffect */ } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, FlatList } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

export default function CategoriesScreen() {
  /** Estado local con datos mock
   *  // API: reemplazar por GET /categories al montar
   *  useEffect(() => {
   *    (async () => {
   *      const res = await fetch(`${API_URL}/categories`);
   *      const data = await res.json();
   *      setCategories(data); // [{id, name}]
   *    })();
   *  }, []);
   */
  const [categories, setCategories] = useState([
    { id: 'c1', name: 'Salario' },
    { id: 'c2', name: 'Renta' },
    { id: 'c3', name: 'Inversiones' },
    { id: 'c4', name: 'Comida' },
    { id: 'c5', name: 'Entretenimiento' },
  ]);

  // Control de modales y formulario
  const [modalType, setModalType] = useState(null); // 'add' | 'edit' | 'delete'
  const [target, setTarget] = useState(null);       // categoría seleccionada para edit/delete
  const [input, setInput] = useState('');           // nombre de categoría en add/edit

  /** Abrir modal de AGREGAR */
  const openAdd = () => { setModalType('add'); setTarget(null); setInput(''); };

  /** Abrir modal de EDITAR (pre-carga nombre) */
  const openEdit = (cat) => { setModalType('edit'); setTarget(cat); setInput(cat.name); };

  /** Abrir modal de ELIMINAR (solo confirma) */
  const openDelete = (cat) => { setModalType('delete'); setTarget(cat); };

  /** Cerrar cualquier modal y limpiar estados */
  const closeModal = () => { setModalType(null); setTarget(null); setInput(''); };

  /** AGREGAR categoría (demo: actualiza estado local)
   *  // API:
   *  const onAdd = async () => {
   *    const name = input.trim(); if (!name) return;
   *    const res = await fetch(`${API_URL}/categories`, {
   *      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name })
   *    });
   *    const created = await res.json(); // {id, name}
   *    setCategories(prev => [...prev, created]); closeModal();
   *  };
   */
  const onAdd = () => {
    const name = input.trim(); if (!name) return;
    setCategories((p) => [...p, { id: `c${Date.now()}`, name }]);
    closeModal();
  };

  /** EDITAR categoría (demo: actualiza estado local)
   *  // API:
   *  const onEdit = async () => {
   *    const name = input.trim(); if (!name || !target) return;
   *    const res = await fetch(`${API_URL}/categories/${target.id}`, {
   *      method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ name })
   *    });
   *    const updated = await res.json(); // {id, name}
   *    setCategories(prev => prev.map(c => c.id === updated.id ? updated : c));
   *    closeModal();
   *  };
   */
  const onEdit = () => {
    const name = input.trim(); if (!name || !target) return;
    setCategories((p) => p.map((c) => c.id === target.id ? { ...c, name } : c));
    closeModal();
  };

  /** ELIMINAR categoría (demo: actualiza estado local)
   *  // API:
   *  const onDelete = async () => {
   *    if (!target) return;
   *    await fetch(`${API_URL}/categories/${target.id}`, { method:'DELETE' });
   *    setCategories(prev => prev.filter(c => c.id !== target.id));
   *    closeModal();
   *  };
   */
  const onDelete = () => {
    if (!target) return;
    setCategories((p) => p.filter((c) => c.id !== target.id));
    closeModal();
  };

  return (
    <LinearGradient colors={['#2c2c2e', '#1c1c1e']} style={{ flex: 1 }}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>LanaApp - Categorías</Text>
        <Ionicons name="settings-sharp" size={20} color="#cfe" />
      </View>

      {/* Lista de categorías */}
      <View style={s.card}>
        <FlatList
          data={categories}
          keyExtractor={(it) => it.id}
          renderItem={({ item }) => (
            <View style={{ paddingVertical: 10 }}>
              <View style={s.row}>
                <Text style={s.catName}>{item.name}</Text>
                <View style={s.actions}>
                  {/* Editar */}
                  <TouchableOpacity style={[s.iconBtn, { backgroundColor: '#F5A524' }]} onPress={() => openEdit(item)}>
                    <MaterialIcons name="edit" size={16} color="#fff" />
                  </TouchableOpacity>
                  {/* Eliminar */}
                  <TouchableOpacity style={[s.iconBtn, { backgroundColor: '#F08AB2' }]} onPress={() => openDelete(item)}>
                    <MaterialIcons name="delete" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={s.divider} />}
          contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 4, paddingBottom: 100 }}
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
            <Text style={s.modalTitle}>Nombre de categoría:</Text>
            {/* Input de nombre (estado 'input') */}
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ej. Educación"
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
            <Text style={s.modalTitle}>¿Seguro que quieres editar esta categoría?</Text>
            {/* Input con el nombre actual (estado 'input') */}
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Nuevo nombre"
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
            <Text style={s.modalTitle}>¿Seguro que quieres eliminar esta categoría?</Text>
            <View style={s.modalActions}>
              <TouchableOpacity style={[s.modalBtn, s.btnCancel]} onPress={closeModal}>
                <Text style={s.btnCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, s.btnDelete]} onPress={onDelete /* API: usar versión async */}>
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
  catName:{ color:'#fff', fontSize:18, fontWeight:'700', flex:1 },
  actions:{ flexDirection:'row', gap:10 },
  iconBtn:{ width:28, height:28, borderRadius:14, alignItems:'center', justifyContent:'center' },

  divider:{ height:1, backgroundColor:'#cfaed3', opacity:0.35 },

  fabContainer:{ position:'absolute', right:16, bottom:22, alignItems:'center' },
  fab:{ width:56, height:56, borderRadius:28, backgroundColor:'#8AA2FF', justifyContent:'center', alignItems:'center', elevation:6 },

  backdrop:{ flex:1, backgroundColor:'rgba(0,0,0,0.45)', justifyContent:'center', alignItems:'center' },
  modalBox:{ width:280, borderRadius:12, borderWidth:1, borderColor:'#f0b6d6', backgroundColor:'rgba(40,40,42,0.98)', padding:16 },
  modalTitle:{ color:'#fff', fontWeight:'700', marginBottom:12, textAlign:'center' },
  input:{ backgroundColor:'#2f2f31', color:'#fff', borderRadius:8, height:40, paddingHorizontal:10, marginBottom:14, borderWidth:1, borderColor:'#cfaed3' },
  modalActions:{ flexDirection:'row', justifyContent:'space-between' },
  modalBtn:{ borderRadius:8, paddingVertical:8, paddingHorizontal:18 },

  btnCancel:{ backgroundColor:'#cfaed3' }, btnCancelText:{ color:'#2b2b2e', fontWeight:'700' },
  btnAdd:{ backgroundColor:'#9BE89B' }, btnAddText:{ color:'#2b2b2e', fontWeight:'700' },
  btnEdit:{ backgroundColor:'#F5A524' }, btnEditText:{ color:'#2b2b2e', fontWeight:'700' },
  btnDelete:{ backgroundColor:'#E5484D' }, btnDeleteText:{ color:'#fff', fontWeight:'700' },
});
