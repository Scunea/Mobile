import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DataTable, FAB, Portal, Dialog, Paragraph, Button, Text, TextInput, useTheme, RadioButton } from 'react-native-paper';
import { Person, User } from './interfaces';

export default function Members(props: { domain: string | undefined; info: User | null; ws: WebSocket | undefined; }) {
    const [showInviteDialog, setShowInviteDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [email, setEmail] = useState('');
    const [subject, setSubject] = useState('');
    const [type, setType] = useState('');
    const [people, setPeople] = useState<Person[]>([]);
    const [checked, setChecked] = useState<string[]>([]);
    const [state, setState] = useState({ open: false });
    const { open } = state;
    const [error, setError] = useState('');

    useEffect(() => {
(async () => {
        if (await AsyncStorage.getItem("token") && await AsyncStorage.getItem("school")) {
            fetch(props.domain + '/people', {
                headers: new Headers({
                    'Authorization': await AsyncStorage.getItem('token') ?? "",
                    'School': await AsyncStorage.getItem('school') ?? ""
                })
            })
                .then(res => res.json()).then(json => {
                    if (!json?.error) {
                        const people = (json as Person[]).sort((a, b) => a.name.localeCompare(b.name));
                        setPeople(people);
                    }
                });
        }
    })();

        if (props.ws) {
            props.ws.addEventListener('message', (message: MessageEvent) => {
                if (message.data !== 'Ping!') {
                    const data = JSON.parse(message.data);
                    if (data.event === 'newUser') {
                        setPeople(people => {
                            let newPeople = [...people];
                            newPeople.push({
                                id: data.user.id,
                                name: data.user.name,
                                email: data.user.email,
                                subject: data.user.subject,
                                children: data.user.children,
                                type: data.user.type.split('').map((x: string, i: number) => i === 0 ? x.toUpperCase() : x).join('')
                            });
                            newPeople = newPeople.sort((a, b) => a.name.localeCompare(b.name));
                            return newPeople;
                        });
                    } else if (data.event === 'editedUser') {
                        setPeople(people => {
                            let newPeople = [...people];
                            const index = newPeople.findIndex(x => x.id === data.user.id);
                            newPeople[index].name = data.user.name;
                            newPeople[index].subject = data.user.subject;
                            newPeople = newPeople.sort((a, b) => a.name.localeCompare(b.name));
                            return newPeople;
                        });
                    } else if (data.event === 'deletedUser') {
                        setPeople(people => {
                            let newPeople = [...people];
                            const index = newPeople.findIndex(x => x.id === data.userId);
                            if (index > -1) {
                                newPeople.splice(index, 1);
                            }
                            newPeople = newPeople.sort((a, b) => a.name.localeCompare(b.name));
                            return newPeople;
                        });
                    }
                }
            });
        };
    }, []);

    const { colors } = useTheme();

    return (
        <View style={{ flex: 1 }}>
            <Portal>
            <Dialog visible={showInviteDialog} onDismiss={() => setShowInviteDialog(false)}>
            <Dialog.Title>Invite user</Dialog.Title>
            <Dialog.Content>
                <TextInput label="Email" autoCapitalize="none" autoComplete="email" value={email} onChangeText={text => setEmail(text)} style={{ marginBottom: 8 }} />
                <RadioButton.Group onValueChange={newValue => setType(newValue)} value={type}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <RadioButton value="student" />
        <Text>Student/Parent</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <RadioButton value="teacher" />
        <Text>Teacher</Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <RadioButton value="administrator" />
        <Text>Administrator</Text>
      </View>
    </RadioButton.Group>
                {type === 'teacher' ? <TextInput label="Subject" value={subject} onChangeText={text => setSubject(text)} style={{ marginTop: 8 }} /> : null}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowInviteDialog(false)}>Cancel</Button>
              <Button disabled={!email || !type || ((type === 'teacher' && !subject))} onPress={async () => {
                fetch(props.domain + '/people', {
                    method: 'PUT',
                    body: JSON.stringify({
                        email: email,
                        type: type,
                        subject: subject
                    }),
                    headers: new Headers({
                        'Authorization': await AsyncStorage.getItem('token') ?? "",
                        'School': await AsyncStorage.getItem('school') ?? "",
                        'Content-Type': 'application/json'
                    })
                }).then(res => res.json()).then(json => {
                    if (!json?.error) {
                        setShowInviteDialog(false);
                        setEmail('');
                        setType('');
                        setSubject('');
                        setSubject('');
                    } else {
                        setError(json.error);
                    }
                });
              }}>Invite</Button>
            </Dialog.Actions>
          </Dialog>
          <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
            <Dialog.Title>Delete users?</Dialog.Title>
            <Dialog.Content>
              <Paragraph>Do you want to delete these users from the school?</Paragraph>
              <Paragraph>{checked.map(x => people.find(y => y.id === x)?.name).join(', ')}</Paragraph>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onPress={async () => {
                fetch(props.domain + '/people', {
                    method: 'DELETE',
                    body: JSON.stringify({
                        tos: checked
                    }),
                    headers: new Headers({
                        'Authorization': await AsyncStorage.getItem('token') ?? "",
                        'School': await AsyncStorage.getItem('school') ?? "",
                        'Content-Type': 'application/json'
                    })
                }).then(res => res.json()).then(json => {
                    if (!json?.error) {
                        setShowDeleteDialog(false);
                    } else {
                        setError(json.error);
                    }
                });
            }}>Delete</Button>
            </Dialog.Actions>
          </Dialog>
          <Dialog visible={!!error} onDismiss={() => setError('')}>
            <Dialog.Title>Error</Dialog.Title>
            <Dialog.Content>
              <Paragraph>{error}</Paragraph>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setError('')}>OK</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
          <ScrollView>
          <DataTable>
      <DataTable.Header>
        <DataTable.Title>Name</DataTable.Title>
        <DataTable.Title>Email</DataTable.Title>
        <DataTable.Title>Subject</DataTable.Title>
        <DataTable.Title>Children</DataTable.Title>
        <DataTable.Title>Type</DataTable.Title>
      </DataTable.Header>

      {people.map(person => <DataTable.Row key={person.id} style={checked.includes(person.id) ? {
        backgroundColor: colors.surfaceDisabled
      } : {}} onPress={() => {
        if(checked.includes(person.id)) {
            setChecked(checked => {
                let newChecked = [...checked];
                newChecked.splice(newChecked.indexOf(person.id), 1);
                return newChecked;
            });
        } else {
            setChecked(checked => {
                let newChecked = [...checked];
                newChecked.push(person.id);
                return newChecked;
            });
        }
      }}>
            <DataTable.Cell>{person.name}</DataTable.Cell>
            <DataTable.Cell>{person.email}</DataTable.Cell>
            <DataTable.Cell>{person.subject ?? 'N/A'}</DataTable.Cell>
            <DataTable.Cell>{person.type === 'Parent' ? person.children?.map(x => x.name).join(', ') : 'N/A'}</DataTable.Cell>
            <DataTable.Cell>{person.type}</DataTable.Cell>
        </DataTable.Row>)}
    </DataTable>
    </ScrollView>
    <FAB.Group visible open={open} icon={open ? 'menu-down' : 'menu-up'} actions={[
            {
              icon: 'plus',
              label: 'Invite',
              onPress: () => setShowInviteDialog(true)
            }
          ].concat((() => {
            if(checked.length > 0) {
            return [{
                    icon: 'delete',
                    label: 'Delete',
                    onPress: () => setShowDeleteDialog(true)
                  }];
            } else {
                return [];
            }
          })())} onStateChange={({ open }) => setState({ open })} />
        </View>
    );
  }
