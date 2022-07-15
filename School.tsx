import { useEffect, useState } from 'react';
import { View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FilePicker from 'react-native-document-picker';
import ReactNativeBlobUtil from 'react-native-blob-util'
import * as FileSystem from 'expo-file-system';
import { Avatar, IconButton, FAB, TextInput, Portal, Dialog, Paragraph, Button } from 'react-native-paper';
import { User, File } from './interfaces';

export default function School(props: { domain: string | undefined; info: User | null; ws: WebSocket | undefined; }) {

    const [schoolName, setSchoolName] = useState('');
    const [newSchoolLogo, setNewSchoolLogo] = useState<File | null>();
    const [error, setError] = useState('');

    useEffect(() => {
        setSchoolName(props.info?.schoolName ?? '');
    }, []);
    
    return (
        <View style={{ flex: 1 }}>
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
            <View style={{ margin: 24 }}>
                <TextInput label="School name" value={schoolName} onChangeText={text => setSchoolName(text)} />
                {newSchoolLogo || props.info?.schoolLogo ? <Avatar.Image source={{ uri: newSchoolLogo ? ('data:' + newSchoolLogo?.type + ';base64,' + newSchoolLogo?.data) : props.domain + '/static/' + props.info?.schoolLogo }} size={124} style={{ alignSelf: 'center', marginTop: 16 }} /> : <Avatar.Icon icon="school" size={124} style={{ alignSelf: 'center', marginTop: 16 }} />}
                <IconButton icon="upload" style={{ alignSelf: 'center', marginTop: 8 }} onPress={() => {
                    FilePicker.pick({
                        type: ['image/*', 'public.image'],
                        copyTo: 'cachesDirectory'
                    }).then((response) => {
                        response.forEach(file => {
                            if(file.fileCopyUri) {
                                FileSystem.readAsStringAsync(file.fileCopyUri, {
                                    encoding: FileSystem.EncodingType.Base64
                                }).then(data => {
                                   setNewSchoolLogo({
                                        name: 'upload',
                                        filename: file.name,
                                        type: file.type ?? '',
                                        data: data
                                    });
                        });
                    }
                    });
                    });
                }} />
            </View>
            <FAB label="Save" icon="floppy" disabled={!newSchoolLogo && schoolName === props.info?.schoolName} style={{ position: 'absolute', margin: 16, right: 0, bottom: 0 }} onPress={async () => {
                if (newSchoolLogo) {
                    ReactNativeBlobUtil.fetch('POST', props.domain + '/upload', {
                        'Authorization': await AsyncStorage.getItem('token') ?? "",
                        'School': await AsyncStorage.getItem('school') ?? "",
                        'Content-Type' : 'multipart/form-data',
                        'simple': 'true'
                    }, [newSchoolLogo]).then(res => res.json()).then(async json => {
                        if (!json?.error) {
                            fetch(props.domain + '/school', {
                                method: 'PATCH',
                                body: JSON.stringify({
                                    name: schoolName,
                                    logo: json.id,
                                }),
                                headers: new Headers({
                                    'Authorization': await AsyncStorage.getItem('token') ?? "",
                                    'School': await AsyncStorage.getItem('school') ?? "",
                                    'Content-Type': 'application/json'
                                })
                            })
                                .then(res => res.json()).then(json => {
                                    if (!json?.error) {
                                        setNewSchoolLogo(null);
                                    } else {
                                        setError(json.error);
                                    }
                                });
                        } else {
                            setError(json.error);
                        }
                    });
                } else {
                    fetch(props.domain + '/school', {
                        method: 'PATCH',
                        body: JSON.stringify({
                            name: schoolName
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
                }
            }} />
        </View>
    );
  }