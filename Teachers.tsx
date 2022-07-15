import { useEffect, useState } from 'react';
import { View, FlatList } from 'react-native';
import { Text } from 'react-native-paper';
import { SimpleUser, User } from './interfaces';

export default function Members(props: { domain: string | undefined; info: User | null; ws: WebSocket | undefined; }) {
    const [teachers, setTeachers] = useState<SimpleUser[]>([]);

    useEffect(() => {
        let extra: SimpleUser[] = [];
        if(props.info?.teacher) {
        extra = [{
            children: props.info?.children,
            id: props.info?.id,
            name: props.info?.name,
            teacher: props.info?.teacher,
            type: props.info?.administrator ?
            'Administrator' : props.info?.teacher ?
            'Teacher' : props.info?.children.length > 0 ?
            'Parent' :
            'Student'
        }];
    }
        setTeachers(props.info?.avaliable.concat(extra).filter(x => x.type === 'Teacher').sort((a, b) => a.name.localeCompare(b.name)) ?? []);
    }, [props.info]);

    return ( 
        <View style={{ flex: 1, margin: 16 }}>
              {teachers.length > 0 ? <FlatList data={teachers} keyExtractor={(item) => item.id} renderItem={({ item }) => <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Text variant="titleMedium">{item.name}: </Text>
            <Text>{item.teacher}</Text>
              </View>} /> : <Text>No teachers!</Text>}
        </View>
    );
  }