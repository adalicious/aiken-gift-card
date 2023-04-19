export function Button(props: any) {
  return (
    <button
      {...props}
      disabled={props.disabled}
      class={`group inline-flex items-center justify-center rounded-full py-2 px-4 text-sm font-semibold focus:outline-none bg-blue-600 text-white hover:bg-blue-500 active:bg-blue-800 active:text-blue-100 ${props.class}`}
    />
  );
}
