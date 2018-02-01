import Vue, { Component } from 'vue';

export interface Container {
  register: (name: string, value: any) => void;

	unregister: (name: string) => void;

	has: (name: string) => boolean;

	bindings: () => IterableIterator<[string, any]>;

	resolve: (name: string) => any;

  // Not shure about what it should return
	parameters: (func: Function) => any;

	prepare: (func: Function, self) => Function;
}

declare module 'vue/types/vue' {
  interface Vue {
    $ioc: Container;
    $services: any;
  }

  interface VueConstructor {
    $ioc: Container;
    services?: string[];
  }
}

declare module 'vue/types/options' {
  interface ComponentOptions<V extends Vue> {
    services?: string[];
  }
}
