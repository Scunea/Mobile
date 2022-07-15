import { Dispatch, useState } from 'react';
import { ScrollView, View, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FilePicker from 'react-native-document-picker';
import * as FileSystem from 'expo-file-system';
import ReactNativeBlobUtil from 'react-native-blob-util'
import { Appbar, Portal, Dialog, Divider, Text, useTheme, Paragraph, Button, List, Chip, TextInput, IconButton } from 'react-native-paper';
import { Activity, User, File, IdPlusUrl, IdPlusName } from './interfaces';

export default function ReadActivity(props: { domain: string | undefined; activities: Activity[]; selectedActivity: Activity | null; setSelectedActivity: (value: React.SetStateAction<Activity | null>) => void; setSelectedEditActivity: Dispatch<Activity | null>; info: User | null; }) {
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [comments, setComments] = useState('');
    const [files, setFiles] = useState<File[]>([]);
    const [error, setError] = useState('');
    
    const { colors } = useTheme();
    
    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Portal>
          <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
            <Dialog.Title>Delete activity?</Dialog.Title>
            <Dialog.Content>
              <Paragraph>Do you want to delete this activity?</Paragraph>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button onPress={async () => {
                fetch(props.domain + '/activities/' + props.selectedActivity?.id, {
                    method: 'DELETE',
                    headers: new Headers({
                        'Authorization': await AsyncStorage.getItem('token') ?? "",
                        'School': await AsyncStorage.getItem('school') ?? ""
                    })
                }).then(res => res.json()).then(json => {
                    setShowDeleteDialog(false);
                    if (!json?.error) {
                        props.setSelectedActivity(null);
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
            <Appbar.Header>
            <Appbar.BackAction onPress={() => props.setSelectedActivity(null)} />
      <Appbar.Content title={props.selectedActivity?.title} />
      {props.selectedActivity?.author.id === props.info?.id || props.info?.administrator ? <>
      <Appbar.Action icon="pencil" onPress={() => {
        props.setSelectedEditActivity(props.selectedActivity);
        props.setSelectedActivity(null);
    }} />
      <Appbar.Action icon="delete" onPress={() => {
        setShowDeleteDialog(true);
      }} />
      </> : null}
    </Appbar.Header>
    <View style={{ padding: 24 }}>
      <Text>{new Date(props.selectedActivity?.date ?? 0).toString()}</Text>
      <Text style={{ color: colors.primary }}>{new Date(props.selectedActivity?.expiration ?? 0).toString()}</Text>
      <Text>Subject: {props.selectedActivity?.subject ? props.selectedActivity?.subject : 'N/A'}</Text>
      <Text>Type: {props.selectedActivity?.type ? props.selectedActivity?.type : 'N/A'}</Text>
      <Text>Delivery: {props.selectedActivity?.delivery ? props.selectedActivity?.delivery : 'N/A'}</Text>
      {(props.selectedActivity?.files?.length ?? 0) > 0 ? <List.Accordion
        title="Files"
        left={props => <List.Icon {...props} icon="file" />}>
        {props.selectedActivity?.files.map(file => <List.Item key={file.id} title={file.name} onPress={() => {
          Linking.openURL(props.domain + '/static/' + file.id + '?name=' + file.name);
        }} />)}
      </List.Accordion> : null}
    </View>
    <Divider />
    <ScrollView>
          <View style={{ padding: 24 }}> 
            <Text>{props.selectedActivity?.description ? props.selectedActivity?.description : 'No description'}</Text>
          </View>
          {props.info?.id !== props.selectedActivity?.author.id && !props.info?.administrator ? <>
          <Chip style={{ margin: 24, marginTop: 8 }} icon={!props.selectedActivity?.result ? props.selectedActivity?.viewed ? 'eye' : 'eye-off' : props.selectedActivity?.result === 'Accepted' ? 'check' : 'cancel'}>{!props.selectedActivity?.result ? props.selectedActivity?.viewed ? 'Viewed' : 'Not viewed​' : props.selectedActivity?.result}</Chip>
          {!props.selectedActivity?.result ? <>
            <Divider style={{ marginTop: 8 }} />
            <View style={{ padding: 24 }}> 
              <Text variant="titleMedium" style={{ marginTop: 8 }}>Your answer</Text>
              <TextInput label="Comments" multiline value={comments} onChangeText={text => setComments(text)} style={{ marginTop: 8 }} />
              <List.Accordion
        title="Files"
        expanded
        left={props => <List.Icon {...props} icon="file" />}>
        {files.map((file, i) => <List.Item key={i} title={file.filename} onPress={() => {
          setFiles(files => {
            let newFiles = [...files];
            newFiles.splice(i, 1);
            return newFiles;
          });
        }} />)}
        </List.Accordion>
             <View style={{ flexDirection: 'row' }}>
                <IconButton icon="attachment" style={{ marginRight: 'auto' }} onPress={() => {
        FilePicker.pick({
            allowMultiSelection: true,
            copyTo: 'cachesDirectory'
        }).then((response) => {
            response.forEach(file => {
                if(file.fileCopyUri) {
                    FileSystem.readAsStringAsync(file.fileCopyUri, {
                        encoding: FileSystem.EncodingType.Base64
                    }).then(data => {
                       setFiles(files => {
                        let newFiles = [...files];
                        newFiles.push({
                            name: 'upload',
                            filename: file.name,
                            type: file.type ?? '',
                            data: data
                        });
                        return newFiles;
                    });
            });
        }
        });
    });
      }} />
                <IconButton icon="send" disabled={comments.length < 1 && files.length < 1} onPress={async () => { 
                                if (files.length > 0) {
                                    ReactNativeBlobUtil.fetch('POST', props.domain + '/upload', {
                                            'Authorization': await AsyncStorage.getItem('token') ?? "",
                                            'School': await AsyncStorage.getItem('school') ?? "",
                                            'Content-Type' : 'multipart/form-data'
                                        }, files).then(res => res.json()).then(async json => {
                                        if (!json?.error) {
                                            const filesIds = (json as IdPlusUrl[]).map(x => x.id);
                                            fetch(props.domain + '/activities/deliver/' + props.selectedActivity?.id, {
                                                method: 'POST',
                                                body: JSON.stringify({
                                                  comments: comments,
                                                  files: filesIds.map((x, i) => { return { id: x, name: files[i].filename }; }),
                                                }),
                                                headers: new Headers({
                                                    'Authorization': await AsyncStorage.getItem('token') ?? "",
                                                    'School': await AsyncStorage.getItem('school') ?? "",
                                                    'Content-Type': 'application/json'
                                                })
                                            })
                                                .then(res => res.json()).then(json => {
                                                    if (!json?.error) {
                                                      setComments('');
                                                      setFiles([]);
                                                    } else {
                                                        setError(json.error);
                                                    }
                                                });
                                        } else {
                                            setError(json.error);
                                        }
                                    });
                                } else {
                                  fetch(props.domain + '/activities/deliver/' + props.selectedActivity?.id, {
                                    method: 'POST',
                                    body: JSON.stringify({
                                      comments: comments
                                    }),
                                    headers: new Headers({
                                        'Authorization': await AsyncStorage.getItem('token') ?? "",
                                        'School': await AsyncStorage.getItem('school') ?? "",
                                        'Content-Type': 'application/json'
                                    })
                                })
                                }

                            }} />
              </View>
            </View>
          </> : null}
        </> : !props.info?.administrator ? Object.values(props.selectedActivity?.delivered ?? {}).map((x, i) => <List.Accordion
        title={x.name}
        left={props => <List.Icon {...props} icon="account" />}>
        <List.Item left={props => <List.Icon {...props} icon="chat" />} title="Comments" />
      <List.Item title={x.comments ? x.comments : 'N/A'} />
      <List.Item left={props => <List.Icon {...props} icon="file" />} title="Files" />
        {x?.files.map((file: IdPlusName) => <List.Item key={file.id} title={file.name} onPress={() => {
          Linking.openURL(props.domain + '/static/' + file.id + '?name=' + file.name);
        }} />)}
        {(props.selectedActivity?.result as any)[Object.keys(props.selectedActivity?.delivered ?? {})[i]] === 'Unchecked' ? <><List.Item left={props => <List.Icon {...props} icon="check" />} title="Options" />
        <List.Item title="Accept" onPress={async () => {
          fetch(props.domain + '/activities/result/' + props.selectedActivity?.id + '/' + Object.keys(props.selectedActivity?.delivered ?? {})[i], {
            method: 'POST',
            body: JSON.stringify({
                result: 'Accepted'
            }),
            headers: new Headers({
                'Authorization': await AsyncStorage.getItem('token') ?? "",
                'School': await AsyncStorage.getItem('school') ?? "",
                'Content-Type': 'application/json'
            })
        })
            .then(res => res.json()).then(json => {
                if (json?.error) {
                    setError(json.error);
                }
            });
        }} />
        <List.Item title="Reject" onPress={async () => {
          fetch(props.domain + '/activities/result/' + props.selectedActivity?.id + '/' + Object.keys(props.selectedActivity?.delivered ?? {})[i], {
            method: 'POST',
            body: JSON.stringify({
                result: 'Rejected'
            }),
            headers: new Headers({
                'Authorization': await AsyncStorage.getItem('token') ?? "",
                'School': await AsyncStorage.getItem('school') ?? "",
                'Content-Type': 'application/json'
            })
          })
            .then(res => res.json()).then(json => {
                if (json?.error) {
                    setError(json.error);
                }
            });
        }} />
        </> : null}
        </List.Accordion>) : null}
    </ScrollView>
        </View>
    );
  }