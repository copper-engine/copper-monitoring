export class Link {
    name: string;
    path: string;
    icon: string;

    constructor(name: string, path: string, icon?: string) {
        this.name = name;
        this.path = path;
        this.icon = icon;
    }
}
