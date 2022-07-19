import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { Text, DataTable, Button, Portal, useTheme, Appbar, Dialog, Paragraph, TextInput } from 'react-native-paper';
import { SimpleUser, Grade, User } from './interfaces';
import MaxModal from './MaxModal';

export default function Grades(props: { domain: string | undefined; info: User | null; ws: WebSocket | undefined; }) {  
    const [selectedUser, setSelectedUser] = useState<SimpleUser | null>(null);
    const [data, setData] = useState<Grade[]>([]);
    const [newData, setNewData] = useState<Grade[]>([]);
    const [error, setError] = useState('');

    useEffect(() => {
    (async () => {
        if (await AsyncStorage.getItem("token") && await AsyncStorage.getItem("school")) {
            if (props.info?.teacher) {
                fetch(props.domain + '/grades', {
                    headers: new Headers({
                        'Authorization': await AsyncStorage.getItem('token') ?? "",
                        'School': await AsyncStorage.getItem('school') ?? ""
                    })
                })
                    .then(res => res.json()).then(json => {
                        if (!json?.error) {
                            setData(json);
                        } else {
                            setError(json.error);
                        }
                    });
            }
        }

        if (props.ws) {
            props.ws.addEventListener('message', (message: MessageEvent) => {
                    const data = JSON.parse(message.data);
                    if (data.event === 'newGrades') {
                        setData(data.grades);
                    }
            });
        }
    })();
    }, []);

    useEffect(() => {
        (async () => {
        if (await AsyncStorage.getItem("token") && await AsyncStorage.getItem("school")) {
            if (props.info?.administrator && selectedUser) {
                fetch(props.domain + '/grades/' + selectedUser.id, {
                    headers: new Headers({
                        'Authorization': await AsyncStorage.getItem('token') ?? "",
                        'School': await AsyncStorage.getItem('school') ?? ""
                    })
                })
                    .then(res => res.json()).then(json => {
                        if (!json?.error) {
                            setData(json);
                        } else {
                            setError(json.error);
                        }
                    });
            }
        }
    })();
    }, [selectedUser]);

    const { colors } = useTheme();

    return (<>
    <Portal>
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
        {props.info?.teacher ? <>
            <View style={{ alignItems: 'center' }}>
                <Text variant="titleLarge">{props.info?.teacher} grades</Text>
                <Text>Note: This data isn't updated automatically to prevent data loss.</Text>
            </View>
            <ScrollView horizontal>
            <DataTable style={{ width: 1000 }}>
      <DataTable.Header>
        <DataTable.Title>Full name</DataTable.Title>
        <DataTable.Title>Deliberation</DataTable.Title>
        <DataTable.Title>Conceptual</DataTable.Title>
        <DataTable.Title>Average of the first four months</DataTable.Title>
        <DataTable.Title>Average of the second four months</DataTable.Title>
        <DataTable.Title>Final grade</DataTable.Title>
      </DataTable.Header>

      {data.map((x, i) => <DataTable.Row key={x.id}>
        <DataTable.Cell>{x.fullName}</DataTable.Cell>
        <TextInput style={{ flex: 1, backgroundColor: colors.background }} underlineColor={colors.surfaceVariant} value={newData.find(y => y.id === x.id)?.deliberation ?? x.deliberation} onChangeText={text => setNewData(newData => {
            let newNewData = [...newData];
            let index = newNewData.findIndex(y => y.id === x.id);
            if(index < 0) {
                index = newNewData.length;
                newNewData[index] = {
                    id: x.id,
                    fullName: x.fullName,
                    subject: x.subject,
                    deliberation: text,
                    conceptual: x.conceptual,
                    averageFirstFour: x.averageFirstFour,
                    averageSecondFour: x.averageSecondFour,
                    final: x.final,
                };
            } else {
                newNewData[index].deliberation = text;
            }
            return newNewData;
        })} />
        <TextInput style={{ flex: 1, backgroundColor: colors.background }} underlineColor={colors.surfaceVariant} value={newData.find(y => y.id === x.id)?.conceptual ?? x.conceptual} onChangeText={text => setNewData(newData => {
            let newNewData = [...newData];
            let index = newNewData.findIndex(y => y.id === x.id);
            if(index < 0) {
                index = newNewData.length;
                newNewData[index] = {
                    id: x.id,
                    fullName: x.fullName,
                    subject: x.subject,
                    deliberation: x.deliberation,
                    conceptual: text,
                    averageFirstFour: x.averageFirstFour,
                    averageSecondFour: x.averageSecondFour,
                    final: x.final,
                };
            } else {
                newNewData[index].conceptual = text;
            }
            return newNewData;
        })} />
        <TextInput style={{ flex: 1, backgroundColor: colors.background }} underlineColor={colors.surfaceVariant} value={newData.find(y => y.id === x.id)?.averageFirstFour ?? x.averageFirstFour} onChangeText={text => setNewData(newData => {
            let newNewData = [...newData];
            let index = newNewData.findIndex(y => y.id === x.id);
            if(index < 0) {
                index = newNewData.length;
                newNewData[index] = {
                    id: x.id,
                    fullName: x.fullName,
                    subject: x.subject,
                    deliberation: x.deliberation,
                    conceptual: x.conceptual,
                    averageFirstFour: text,
                    averageSecondFour: x.averageSecondFour,
                    final: x.final,
                };
            } else {
                newNewData[index].averageFirstFour = text;
            }
            return newNewData;
        })} />
        <TextInput style={{ flex: 1, backgroundColor: colors.background }} underlineColor={colors.surfaceVariant} value={newData.find(y => y.id === x.id)?.averageSecondFour ?? x.averageSecondFour} onChangeText={text => setNewData(newData => {
            let newNewData = [...newData];
            let index = newNewData.findIndex(y => y.id === x.id);
            if(index < 0) {
                index = newNewData.length;
                newNewData[index] = {
                    id: x.id,
                    fullName: x.fullName,
                    subject: x.subject,
                    deliberation: x.deliberation,
                    conceptual: x.conceptual,
                    averageFirstFour: x.averageFirstFour,
                    averageSecondFour: text,
                    final: x.final,
                };
            } else {
                newNewData[index].averageSecondFour = text;
            }
            return newNewData;
        })} />
        <TextInput style={{ flex: 1, backgroundColor: colors.background }} underlineColor={colors.surfaceVariant} value={newData.find(y => y.id === x.id)?.final ?? x.final} onChangeText={text => setNewData(newData => {
            let newNewData = [...newData];
            let index = newNewData.findIndex(y => y.id === x.id);
            if(index < 0) {
                index = newNewData.length;
                newNewData[index] = {
                    id: x.id,
                    fullName: x.fullName,
                    subject: x.subject,
                    deliberation: x.deliberation,
                    conceptual: x.conceptual,
                    averageFirstFour: x.averageFirstFour,
                    averageSecondFour: x.averageSecondFour,
                    final: text,
                };
            } else {
                newNewData[index].final = text;
            }
            return newNewData;
        })} />
      </DataTable.Row>)}
    </DataTable>
    </ScrollView>
    <Button icon="floppy" mode="contained" disabled={!newData.map(x => {
            return data.find(y => y.id === x.id)?.deliberation === x.deliberation && data.find(y => y.id === x.id)?.conceptual === x.conceptual && data.find(y => y.id === x.id)?.averageFirstFour === x.averageFirstFour && data.find(y => y.id === x.id)?.averageSecondFour === x.averageSecondFour && data.find(y => y.id === x.id)?.final === x.final;
        }).includes(false)} style={{ margin: 8 }} onPress={async () => {
                    fetch(props.domain + '/grades', {
                        method: 'POST',
                        body: JSON.stringify(data.map(x => {
                            if(newData.find(x => x.id)) {
                                return newData.find(x => x.id) ?? x;
                            } else {
                                return x;
                            }
                        })),
                        headers: new Headers({
                            'Authorization': await AsyncStorage.getItem('token') ?? "",
                            'School': await AsyncStorage.getItem('school') ?? "",
                            'Content-Type': 'application/json'
                        })
                    }).then(res => res.json()).then(json => {
                        if (!json?.error) {
                            setData(data.map(x => {
                                if(newData.find(x => x.id)) {
                                    return newData.find(x => x.id) ?? x;
                                } else {
                                    return x;
                                }
                            }));
                            setNewData([]);
                        } else {
                            setError(json.error);
                        }
                    });
                }}>Save</Button>
        </> : props.info?.administrator ? <>
        <Portal>
        <MaxModal visible={!!selectedUser} onDismiss={() => setSelectedUser(null)}>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Appbar.Header>
            <Appbar.BackAction onPress={() => setSelectedUser(null)} />
      <Appbar.Content title={selectedUser?.name + '\'s grades'} />
    </Appbar.Header>
    <ScrollView horizontal>
            <DataTable style={{ width: 1000 }}>
      <DataTable.Header>
        <DataTable.Title>Subject</DataTable.Title>
        <DataTable.Title>Deliberation</DataTable.Title>
        <DataTable.Title>Conceptual</DataTable.Title>
        <DataTable.Title>Average of the first four months</DataTable.Title>
        <DataTable.Title>Average of the second four months</DataTable.Title>
        <DataTable.Title>Final grade</DataTable.Title>
      </DataTable.Header>

      {props.info?.grades?.map(x => <DataTable.Row key={x.id}>
        <DataTable.Cell>{x.subject}</DataTable.Cell>
        <DataTable.Cell>{x.deliberation}</DataTable.Cell>
        <DataTable.Cell>{x.conceptual}</DataTable.Cell>
        <DataTable.Cell>{x.averageFirstFour}</DataTable.Cell>
        <DataTable.Cell>{x.averageSecondFour}</DataTable.Cell>
        <DataTable.Cell>{x.final}</DataTable.Cell>
      </DataTable.Row>)}
    </DataTable>
        </ScrollView>
        </View>
        </MaxModal>
        </Portal>
        <View>
        <Text variant="titleLarge" style={{ alignSelf: 'center' }}>Choose a student</Text>
        {props.info?.available.filter(x => x.type === 'student').length > 0 ? props.info?.available.filter(x => x.type === 'student').sort((a, b) => a.name.localeCompare(b.name)).map((x, i) => <Button icon="school" key={i} style={{ marginTop: 4 }} onPress={() => {
                setSelectedUser(x);
            }}>
                {x.name}
            </Button>) : <Text>No students!</Text>}
        </View>
        </> : (props.info?.children?.length ?? 0 < 1) ? <>
            <View style={{ alignItems: 'center' }}>
                <Text variant="titleLarge">Your children's grades</Text>
            </View>
            <ScrollView horizontal>
            <DataTable style={{ width: 1000 }}>
      <DataTable.Header>
        <DataTable.Title>Full name</DataTable.Title>
        <DataTable.Title>Deliberation</DataTable.Title>
        <DataTable.Title>Conceptual</DataTable.Title>
        <DataTable.Title>Average of the first four months</DataTable.Title>
        <DataTable.Title>Average of the second four months</DataTable.Title>
        <DataTable.Title>Final grade</DataTable.Title>
      </DataTable.Header>

      {props.info?.grades?.map(x => <DataTable.Row key={x.id}>
        <DataTable.Cell>{x.fullName}</DataTable.Cell>
        <DataTable.Cell>{x.deliberation}</DataTable.Cell>
        <DataTable.Cell>{x.conceptual}</DataTable.Cell>
        <DataTable.Cell>{x.averageFirstFour}</DataTable.Cell>
        <DataTable.Cell>{x.averageSecondFour}</DataTable.Cell>
        <DataTable.Cell>{x.final}</DataTable.Cell>
      </DataTable.Row>)}
    </DataTable>
    </ScrollView>
        </> : <>
            <View style={{ alignItems: 'center' }}>
                <Text variant="titleLarge">Your grades</Text>
            </View>
            <ScrollView horizontal>
            <DataTable style={{ width: 1000 }}>
      <DataTable.Header>
        <DataTable.Title>Subject</DataTable.Title>
        <DataTable.Title>Deliberation</DataTable.Title>
        <DataTable.Title>Conceptual</DataTable.Title>
        <DataTable.Title>Average of the first four months</DataTable.Title>
        <DataTable.Title>Average of the second four months</DataTable.Title>
        <DataTable.Title>Final grade</DataTable.Title>
      </DataTable.Header>

      {props.info?.grades?.map(x => <DataTable.Row key={x.id}>
        <DataTable.Cell>{x.subject}</DataTable.Cell>
        <DataTable.Cell>{x.deliberation}</DataTable.Cell>
        <DataTable.Cell>{x.conceptual}</DataTable.Cell>
        <DataTable.Cell>{x.averageFirstFour}</DataTable.Cell>
        <DataTable.Cell>{x.averageSecondFour}</DataTable.Cell>
        <DataTable.Cell>{x.final}</DataTable.Cell>
      </DataTable.Row>)}
    </DataTable>
    </ScrollView>
        </>}
        </>
    );
  }