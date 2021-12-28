<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [resonant](./resonant.md) &gt; [effect](./resonant.effect.md)

## effect() function

Create a resonant effect. All get / set operations within the handler will be tracked. An effect is run upon initialization, and subsequent to any mutations to its dependencies.

<b>Signature:</b>

```typescript
export declare function effect(handler: () => void, opts?: IEffectOptions): {
    start: () => void;
    stop: () => void;
    toggle: () => boolean;
};
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  handler | () =&gt; void |  |
|  opts | IEffectOptions |  |

<b>Returns:</b>

{ start: () =&gt; void; stop: () =&gt; void; toggle: () =&gt; boolean; }
