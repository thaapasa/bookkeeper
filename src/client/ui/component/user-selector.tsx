import * as React from 'react';
import UserAvatar from './user-avatar';
import * as state from '../../data/State';

const styles = {
    container: {
        display: 'inline-block',
    },
    avatar: {
        margin: '0 0.2em',
        verticalAlign: 'top',
    }
};

export default class UserSelector extends React.Component<any, any> {
    
    private switchSelection = (id) => {
        const oldS = this.props.selected;
        const foundAt = oldS.indexOf(id);
        const newS = foundAt >= 0 ? oldS.slice().filter(i => i !== id) : oldS.slice();
        if (foundAt < 0) { newS.push(id); }
        newS.sort();
        this.props.onChange && this.props.onChange(newS);
    }

    public render() {
        const style = { ...styles.container, ...this.props.style };
        const users = state.get('users');
        return <div style={style}>
            { users.map(u =>
                <UserAvatar
                    key={u.id}
                    userId={u.id}
                    style={styles.avatar}
                    className={this.props.selected.includes(u.id) ? 'selected' : 'unselected' }
                    onClick={x => this.switchSelection(u.id)}>{u.firstName.charAt(0)}</UserAvatar>) }
        </div>
    }
}
