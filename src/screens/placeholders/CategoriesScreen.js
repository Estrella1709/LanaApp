/**
 * CategoriesScreen (conectada a FastAPI)
 * - Carga categorías al entrar (GET /categories/)
 * - Agrega (POST /categories/)
 * - Edita  (PUT   /categories/{id})
 * - Borra  (DELETE /categories/{id})
 */

import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  TextInput, FlatList, Alert, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as api from '../../services/api';   // 👈 importa TODO como api

export default function CategoriesScreen() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalType, setModalType] = useState(null);
  const [target, setTarget] = useState(null);
  const [input, setInput] = useState('');

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      setLoading(true);
      const res = await api.getCategoriesApi();  // 👈
      const norm = Array.isArray(res)
        ? res.map(c => ({
            id: c.id ?? c.ID ?? c.Id ?? c.id_category ?? c.idCategory,
            name: c.name ?? c.Nombre ?? c.nombre ?? 'Sin nombre',
            description: c.description ?? '',
            schedulable: !!c.schedulable,
          })).filter(c => c.id != null)
        : [];
      setCategories(norm);
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudieron cargar las categorías');
    } finally {
      setLoading(false);
    }
  };

  const openAdd    = () => { setModalType('add'); setTarget(null); setInput(''); };
  const openEdit   = (cat) => { setModalType('edit'); setTarget(cat); setInput(cat.name); };
  const openDelete = (cat) => { setModalType('delete'); setTarget(cat); };
  const closeModal = () => { setModalType(null); setTarget(null); setInput(''); };

  const onAdd = async () => {
    const name = input.trim(); if (!name) return;
    try {
      setLoading(true);
      const created = await api.createCategoryApi({ name, description: '', schedulable: false }); // 👈
      const cat = created?.id ? created
                : created?.categoria?.id ? created.categoria
                : { id: Date.now(), name, description: '', schedulable: false };
      setCategories(prev => [...prev, {
        id: cat.id, name: cat.name ?? name,
        description: cat.description ?? '',
        schedulable: !!cat.schedulable
      }]);
      closeModal();
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo crear la categoría');
    } finally {
      setLoading(false);
    }
  };

  const onEdit = async () => {
    const name = input.trim(); if (!name || !target) return;
    try {
      setLoading(true);
      const payload = {
        name,
        description: target.description ?? '',
        schedulable: !!target.schedulable,
      };
      const updated = await api.updateCategoryApi(target.id, payload); // 👈
      const updatedCat = updated?.id ? updated : { ...target, ...payload };
      setCategories(prev => prev.map(c =>
        c.id === target.id
          ? { ...c,
              name: updatedCat.name ?? name,
              description: updatedCat.description ?? '',
              schedulable: !!updatedCat.schedulable
            }
          : c
      ));
      closeModal();
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo editar la categoría');
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!target) return;
    try {
      setLoading(true);
      await api.deleteCategoryApi(target.id); // 👈
      setCategories(prev => prev.filter(c => c.id !== target.id));
      closeModal();
    } catch (e) {
      Alert.alert('Error', e.message || 'No se pudo eliminar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#2c2c2e', '#1c1c1e']} style={{ flex: 1 }}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>LanaApp - Categorías</Text>
        <Ionicons name="settings-sharp" size={20} color="#cfe" />
      </View>

      {/* Lista */}
      <View style={s.card}>
        {loading && categories.length === 0 ? (
          <View style={{ paddingVertical: 30, alignItems:'center' }}>
            <ActivityIndicator />
            <Text style={{ color:'#ccc', marginTop:8 }}>Cargando…</Text>
          </View>
        ) : (
          <FlatList
            data={categories}
            keyExtractor={(it) => String(it.id)}
            renderItem={({ item }) => (
              <View style={{ paddingVertical: 10 }}>
                <View style={s.row}>
                  <Text style={s.catName}>{item.name}</Text>
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
            contentContainerStyle={{ paddingVertical: 10, paddingHorizontal: 4, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* FAB */}
      <View style={s.fabContainer}>
        <TouchableOpacity style={s.fab} onPress={openAdd} activeOpacity={0.9}>
          <Ionicons name="add" size={26} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* MODALES */}
      <Modal visible={modalType === 'add'} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={s.backdrop}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Nombre de categoría:</Text>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Ej. Educación"
              placeholderTextColor="#bfbfbf"
              style={s.input}
            />
            <View style={s.modalActions}>
              <TouchableOpacity style={[s.modalBtn, s.btnCancel]} onPress={closeModal}><Text style={s.btnCancelText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, s.btnAdd]} onPress={onAdd}><Text style={s.btnAddText}>Agregar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalType === 'edit'} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={s.backdrop}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>Editar categoría</Text>
            <TextInput
              value={input}
              onChangeText={setInput}
              placeholder="Nuevo nombre"
              placeholderTextColor="#bfbfbf"
              style={s.input}
            />
            <View style={s.modalActions}>
              <TouchableOpacity style={[s.modalBtn, s.btnCancel]} onPress={closeModal}><Text style={s.btnCancelText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, s.btnEdit]} onPress={onEdit}><Text style={s.btnEditText}>Editar</Text></TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={modalType === 'delete'} transparent animationType="fade" onRequestClose={closeModal}>
        <View style={s.backdrop}>
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>¿Seguro que quieres eliminar esta categoría?</Text>
            <View style={s.modalActions}>
              <TouchableOpacity style={[s.modalBtn, s.btnCancel]} onPress={closeModal}><Text style={s.btnCancelText}>Cancelar</Text></TouchableOpacity>
              <TouchableOpacity style={[s.modalBtn, s.btnDelete]} onPress={onDelete}><Text style={s.btnDeleteText}>Eliminar</Text></TouchableOpacity>
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
