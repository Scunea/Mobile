import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { Pressable, View, FlatList } from 'react-native';
import { Appbar, useTheme, Avatar, Text, Divider } from 'react-native-paper';
import { getInitials } from './initials';
import { SimpleUser, User, Receiver } from './interfaces';

export default function Receivers(props: { info: User | null; receiver: string[]; setReceiver: Dispatch<SetStateAction<string[]>>; setShowReceiversDialog: Dispatch<SetStateAction<boolean>>; activity?: boolean; }) {

    const [receivers, setReceivers] = useState<Receiver[]>([]);
    const [receiver, setReceiver] = useState<string[]>([]);

    useEffect(() => {
        setReceiver(props.receiver);
    }, []);

    useEffect(() => {
        if (props.info) {
            setReceivers(() => {
                const administrators = props.info?.avaliable.filter((x: SimpleUser) => x.type === 'Administrator');
                const teachers = props.info?.avaliable.filter((x: SimpleUser) => x.type === 'Teacher');
                const students = props.info?.avaliable.filter((x: SimpleUser) => x.type === 'Student');
                const parents = props.info?.avaliable.filter((x: SimpleUser) => x.type === 'Parent');

                let thingy: Receiver[] = [];
                thingy.push({ key: 'selectors', text: 'Selectors', type: 'Header', noDivider: true });
                thingy.push({ key: 'all', text: 'All' });
                if(!props.activity) {
                if (props.info?.teacher || props.info?.administrator) {
                    if((administrators?.length ?? 0) > 0) {
                        thingy.push({ key: 'allAdministrators', text: 'All administrators' });
                    }
                    if((teachers?.length ?? 0) > 0) {
                        thingy.push({ key: 'allTeachers', text: 'All teachers' });
                    }
                    if((students?.length ?? 0) > 0) {
                        thingy.push({ key: 'allStudents', text: 'All students' });
                    }
                    if((parents?.length ?? 0) > 0) {
                        thingy.push({ key: 'allParents', text: 'All parents' });
                    }
                    if((administrators?.length ?? 0) > 0) {
                        thingy.push({ key: 'administratorsHeader', text: 'Administrators', type: 'Header' });
                        thingy = thingy.concat(administrators?.map((x: SimpleUser) => { return { key: x.id, text: x.name }; }) ?? []);
                    }
                    if((teachers?.length ?? 0) > 0) {
                        thingy.push({ key: 'teachersHeader', text: 'Teachers', type: 'Header' });
                        thingy = thingy.concat(teachers?.map((x: SimpleUser) => { return { key: x.id, text: x.name }; }) ?? []);
                    }
                    if((students?.length ?? 0) > 0) {
                        thingy.push({ key: 'studentsHeader', text: 'Students', type: 'Header' });
                        thingy = thingy.concat(students?.map((x: SimpleUser) => { return { key: x.id, text: x.name }; }) ?? []);
                    }
                    if((parents?.length ?? 0) > 0) {
                        thingy.push({ key: 'parentsHeader', text: 'Parents', type: 'Header' });
                        thingy = thingy.concat(parents?.map((x: SimpleUser) => { return { key: x.id, text: x.name }; }) ?? []);
                    }
                } else {
                    if((administrators?.length ?? 0) > 0) {
                        thingy.push({ key: 'allAdministrators', text: 'All administrators' });
                    }
                    if((teachers?.length ?? 0) > 0) {
                        thingy.push({ key: 'allTeachers', text: 'All teachers' });
                    }
                    if((administrators?.length ?? 0) > 0) {
                        thingy.push({ key: 'administratorsHeader', text: 'Administrators', type: 'Header' });
                        thingy = thingy.concat(administrators?.map((x: SimpleUser) => { return { key: x.id, text: x.name }; }) ?? []);
                    }
                    if((teachers?.length ?? 0) > 0) {
                        thingy.push({ key: 'teachersHeader', text: 'Teachers', type: 'Header' });
                        thingy = thingy.concat(teachers?.map((x: SimpleUser) => { return { key: x.id, text: x.name }; }) ?? []);
                    }
                    }
                } else {
                    if((students?.length ?? 0) > 0) {
                        thingy.push({ key: 'studentsHeader', text: 'Students', type: 'Header' });
                        thingy = thingy.concat(students?.map((x: SimpleUser) => { return { key: x.id, text: x.name }; }) ?? []);
                    }
                }
                return thingy;
            });
        }
    }, [props.info]);

    const { colors } = useTheme();

    

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Appbar.Header>
            <Appbar.Action icon="account-multiple" />
      <Appbar.Content title="Select receivers" />
      <Appbar.Action icon="floppy" onPress={() => {
        props.setReceiver(receiver);
        props.setShowReceiversDialog(false);
      }} />
    </Appbar.Header>
    <FlatList data={receivers} contentContainerStyle={{ padding: 12 }} renderItem={({ item }) => <Pressable style={{ marginTop: 8 }} onPress={() => {
        if (item && item.key !== 'all' && item.key !== 'allStudents' && item.key !== 'allParents' && item.key !== 'allTeachers') {
            setReceiver(
                !receiver.includes(item.key) ? [...receiver, item.key as string] : receiver.filter(key => key !== item.key),
            );
        } else if (item?.key === 'all') {
            if (receiver.sort().join() !== props.info?.avaliable.map((x: SimpleUser) => x.id).sort().join()) {
                setReceiver(props.info?.avaliable.map((x: SimpleUser) => x.id) ?? []);
            } else {
                setReceiver([]);
            }
        } else if (item?.key === 'allStudents') {
            const thingy = props.info?.avaliable.filter((x: SimpleUser) => x.type === 'Student').map((x: SimpleUser) => x.id);
            let found = 0;
            thingy?.forEach((x: string) => {
                if (receiver.includes(x)) {
                    found++;
                }
            });
            if (found !== thingy?.length) {
                setReceiver(Receiver => {
                    let newReceiver = [...Receiver];
                    thingy?.forEach((x: string) => {
                        if (!newReceiver.includes(x)) {
                            newReceiver.push(x);
                        }
                    });
                    return newReceiver;
                });
            } else {
                setReceiver(Receiver => {
                    let newReceiver = [...Receiver];
                    thingy.forEach((x: string) => {
                        newReceiver.splice(newReceiver.indexOf(x), 1)
                    })
                    return newReceiver;
                });
            }
        } else if (item?.key === 'allAdministrators') {
            const thingy = props.info?.avaliable.filter((x: SimpleUser) => x.type === 'Administrator').map((x: SimpleUser) => x.id);
            let found = 0;
            thingy?.forEach((x: string) => {
                if (receiver.includes(x)) {
                    found++;
                }
            });
            if (found !== thingy?.length) {
                setReceiver(Receiver => {
                    let newReceiver = [...Receiver];
                    thingy?.forEach((x: string) => {
                        if (!newReceiver.includes(x)) {
                            newReceiver.push(x);
                        }
                    });
                    return newReceiver;
                });
            } else {
                setReceiver(Receiver => {
                    let newReceiver = [...Receiver];
                    thingy.forEach((x: string) => {
                        newReceiver.splice(newReceiver.indexOf(x), 1)
                    })
                    return newReceiver;
                });
            }
        } else if (item?.key === 'allParents') {
            const thingy = props.info?.avaliable.filter((x: SimpleUser) => x.type === 'Parent').map((x: SimpleUser) => x.id);
            let found = 0;
            thingy?.forEach((x: string) => {
                if (receiver.includes(x)) {
                    found++;
                }
            });
            if (found !== thingy?.length) {
                setReceiver(Receiver => {
                    let newReceiver = [...Receiver];
                    thingy?.forEach((x: string) => {
                        if (!newReceiver.includes(x)) {
                            newReceiver.push(x);
                        }
                    });
                    return newReceiver;
                });
            } else {
                setReceiver(Receiver => {
                    let newReceiver = [...Receiver];
                    thingy.forEach((x: string) => {
                        newReceiver.splice(newReceiver.indexOf(x), 1)
                    })
                    return newReceiver;
                });
            }
        } else if (item?.key === 'allTeachers') {
            const thingy = props.info?.avaliable.filter((x: SimpleUser) => x.type === 'Teacher').map((x: SimpleUser) => x.id);
            let found = 0;
            thingy?.forEach((x: string) => {
                if (receiver.includes(x)) {
                    found++;
                }
            });
            if (found !== thingy?.length) {
                setReceiver(Receiver => {
                    let newReceiver = [...Receiver];
                    thingy?.forEach((x: string) => {
                        if (!newReceiver.includes(x)) {
                            newReceiver.push(x);
                        }
                    });
                    return newReceiver;
                });
            } else {
                setReceiver(Receiver => {
                    let newReceiver = [...Receiver];
                    thingy.forEach((x: string) => {
                        newReceiver.splice(newReceiver.indexOf(x), 1)
                    })
                    return newReceiver;
                });
            }
        }
    }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {!item.key?.startsWith('all') ? item.type !== 'Header' ? !receiver.includes(item.key) ? <Avatar.Text size={48} style={{ marginRight: 8 }} label={getInitials(item.text ?? '', false, false)} /> : <Avatar.Icon size={48} style={{ marginRight: 8 }} icon="check" /> : <View style={{ width: '100%' }}>
        {!item.noDivider ? <Divider style={{ margin: 4 }} /> : null}
        <Text>{item.text}</Text>
        </View> : <Avatar.Icon size={48} style={{ marginRight: 8 }} icon="circle" />}
        {item.type !== 'Header' ? <Text>{item.text}</Text> : null}
    </View>
        </Pressable>} />
    </View>
    );
  }