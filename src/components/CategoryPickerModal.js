import { Modal, View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';

export default function CategoryPickerModal({ visible, title="Categoría:", categories=[], onClose, onSelect }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={s.backdrop}>
        <View style={s.sheet}>
          <Text style={s.title}>{title}</Text>
          <FlatList
            data={categories}
            keyExtractor={(it, i) => `${it}-${i}`}
            ItemSeparatorComponent={() => <View style={s.sep} />}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.row} onPress={() => { onSelect?.(item); onClose?.(); }}>
                <Text style={s.item}>{item}</Text>
              </TouchableOpacity>
            )}
            contentContainerStyle={{ paddingBottom: 4 }}
            showsVerticalScrollIndicator={false}
          />
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop:{ flex:1, backgroundColor:'rgba(0,0,0,0.45)', justifyContent:'center', alignItems:'center' },
  sheet:{ width:260, borderRadius:12, borderWidth:1, borderColor:'#f0b6d6', backgroundColor:'rgba(40,40,42,0.98)', padding:14 },
  title:{ color:'#eee', marginBottom:10, fontWeight:'700' },
  sep:{ height:1, backgroundColor:'#cfaed3', opacity:0.4 },
  row:{ paddingVertical:10 },
  item:{ color:'#fff', fontSize:16 }
});
