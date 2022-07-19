import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, FlatList } from 'react-native';
import { Divider, Text, TextInput, Button } from 'react-native-paper';
import { IdPlusName, User } from './interfaces';

export default function Parents(props: { domain: string | undefined; info: User | null; ws: WebSocket | undefined; }) {

    const [childrenInvites, setChildrenInvites] = useState<IdPlusName[]>([]);
    const [parentsInvites, setParentsInvites] = useState<IdPlusName[]>([]);
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        (async () => {
        fetch(props.domain + '/pendingchildren', {
            headers: new Headers({
              'Authorization': await AsyncStorage.getItem('token') ?? "",
              'School': await AsyncStorage.getItem('school') ?? ""
            })
          })
            .then(res => res.json()).then(json => {
              if (!json?.error) {
                setChildrenInvites(json);
              } else {
                setError(json.error);
              }
            });
    
          fetch(props.domain + '/pendingparents', {
            headers: new Headers({
              'Authorization': await AsyncStorage.getItem('token') ?? "",
              'School': await AsyncStorage.getItem('school') ?? ""
            })
          })
            .then(res => res.json()).then(json => {
              if (!json?.error) {
                setParentsInvites(json);
              } else {
                setError(json.error);
              }
            });
        })();

        if (props.ws) {
            props.ws.addEventListener('message', (message: MessageEvent) => {
                const data = JSON.parse(message.data);
                if (data.event === 'parentInvited') {
                  setParentsInvites(parents => {
                    let newParents = [...parents];
                    newParents.push(data.parent);
                    return newParents;
                  });
                } else if (data.event === 'childrenInvited') {
                  setChildrenInvites(children => {
                    let newChildren = [...children];
                    newChildren.push(data.children);
                    return newChildren;
                  });
                } else if (data.event === 'parentInviteRemoved') {
                  setParentsInvites(parents => {
                    let newParents = [...parents];
                    const index = newParents.findIndex(x => x?.id === data.id);
                    if (index > -1) {
                      newParents.splice(data.id, 1);
                    }
                    return newParents;
                  });
                } else if (data.event === 'childrenInviteRemoved') {
                  setChildrenInvites(children => {
                    let newChildren = [...children];
                    const index = newChildren.findIndex(x => x?.id === data.id);
                    if (index > -1) {
                      newChildren.splice(data.id, 1);
                    }
                    return newChildren;
                  });
                }
            });
          }
    }, []);

    return (
    <View style={{ flex: 1 }}>
        <View style={{ margin: 24 }}>
            <Text variant="titleMedium">Invite your parents</Text>
            <TextInput label="Email" autoCapitalize="none" autoComplete="email" value={email} onChangeText={text => setEmail(text)} />
            <Button mode="contained" disabled={!email} style={{ marginTop: 8 }} onPress={async () => {
                 fetch(props.domain + '/parents', {
                    method: 'PUT',
                    body: JSON.stringify({
                      email: email
                    }),
                    headers: new Headers({
                        'Authorization': await AsyncStorage.getItem('token') ?? "",
                        'School': await AsyncStorage.getItem('school') ?? "",
                        'Content-Type': 'application/json'
                    })
                })
                    .then(res => res.json()).then(json => {
                        if (!json?.error) {
                            setEmail('');
                        }
                    });
            }}>Invite</Button>
        </View>
        <Divider />
        <View style={{ margin: 24 }}>
            <Text variant="titleMedium">Accept an invite</Text>
            {childrenInvites.length > 0 ? <FlatList data={childrenInvites} keyExtractor={(item) => item.id} renderItem={({ item }) => <Button icon="human-male-child" onPress={async () => {
                    fetch(props.domain + '/accept/' + item.id, {
                      method: 'POST',
                      headers: new Headers({
                        'Authorization': await AsyncStorage.getItem('token') ?? "",
                        'School': await AsyncStorage.getItem('school') ?? ""
                      })
                    }).then(res => res.json()).then(json => {
                      if (json?.error) {
                        setError(json.error);
                      }
                    });
                  }}>{item.name}</Button>} /> : <Text>No invites available.</Text>}
        </View>
        <Divider />
        <View style={{ margin: 24 }}>
            <Text variant="titleMedium">Your pending invites</Text>
            {parentsInvites.length > 0 ? <FlatList data={parentsInvites} keyExtractor={(item) => item.id} renderItem={({ item }) => <Button icon="human-male-child" onPress={async () => {
                    fetch(props.domain + '/parents/' + item.id, {
                        method: 'DELETE',
                      headers: new Headers({
                        'Authorization': await AsyncStorage.getItem('token') ?? "",
                        'School': await AsyncStorage.getItem('school') ?? ""
                      })
                    }).then(res => res.json()).then(json => {
                      if (json?.error) {
                        setError(json.error);
                      }
                    });
                  }}>{item.name}</Button>} /> : <Text>You didn't invite anyone.</Text>}
        </View>
    </View>
    );
  }