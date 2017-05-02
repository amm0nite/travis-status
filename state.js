const isObject = require('lodash.isobject');
const cloneDeep = require('lodash.clonedeep');

class State {
    constructor(status) {
        this.size = { w:8, h:4 };
        this.status = {};
        if (isObject(status)) {
            this.status = cloneDeep(status);
        }
        this.leaderboard = [];
        for (let i=0; i<(this.size.w * this.size.h); i++) {
            this.leaderboard[i] = {};
        }
    }

    update(data) {
        this._refreshLeaderboard();
        let branch = this._importBranch(data);
        this._processBranch(branch);
    }

    _importBranch(data) {
        if (!data.repository) {
            throw new Error('no repository');
        }

        let repo = data.repository.name;
        if (!this.status.hasOwnProperty(repo)) {
            this.status[repo] = {};
        }

        let branch = data.branch;
        if (!this.status[repo].hasOwnProperty(branch)) {
            this.status[repo][branch] = {};
        }

        if (!this.status[repo][branch].build || data.number > this.status[repo][branch].build) {
            this.status[repo][branch].build = parseInt(data.number);
        }
        if (data.number < this.status[repo][branch].build) {
            throw new Error('build is old');
        }
        this.status[repo][branch].status = data.status_message;

        return this.status[repo][branch];
    }

    _refreshLeaderboard() {
        Object.keys(this.status).forEach((repoName) => {
            let repo = this.status[repoName];

            Object.keys(repo).forEach((branchName) => {
                let branch = this.status[repoName][branchName];
                branch.index = parseInt(branch.index);
                branch.build = parseInt(branch.build);

                this._processBranch(branch);
            });
        });
    }

    _processBranch(branch) {
        if (!branch.index && branch.index !== 0) {
            branch.index = this._getLeaderboardPosition(branch.build);
        }
        
        if (branch.index == -1) {
            console.log('deleting ' + branchName);
            delete this.status[repoName][branchName];
        }
        else {
            this.leaderboard[branch.index].value = branch.status;
            this.leaderboard[branch.index].score = branch.build;
        }
    }

    _getLeaderboardPosition(score) {
        if (!score) {
            score = 0;
        }

        let lowest = { score: Number.MAX_SAFE_INTEGER, index: -1 };
        for (let index in this.leaderboard) {
            let position = this.leaderboard[index];
            if (!position.value) {
                return index;
            }
            if (position.score < lowest.score) {
                lowest.score = position.score;
                lowest.index = index;
            }
        }

        if (score >= lowest.score) {
            return lowest.index;
        }
        return -1;
    }

    dump() {
        return cloneDeep(this.status);
    }

    _statusColor(status) {
        if (!status) {
            return { r:0, g:0, b:0 };
        }

        if (status == 'passed' || status == 'fixed') {
            return { r:0, g:255, b:0 };
        }
        if (status == 'pending') {
            return { r:255, g:255, b:0 };
        }
        if (status == 'failed' || status == 'still failing' || status == 'broken') {
            return { r:255, g:0, b:0 };
        }

        return { r:0, g:0, b:255 };
    }

    buildMap() {
        let map = [];
        
        for (let y=0; y<this.size.h; y++) {
            for (let x=0; x<this.size.w; x++) {
                map.push({ x:x, y:y });
            }
        }

        for (let index in this.leaderboard) {
            let state = this.leaderboard[index].value;
            if (state) {
                map[index].color = this._statusColor(state.toLowerCase());
            }
        }

        return map;
    }
}

module.exports = State;