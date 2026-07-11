// 为传入的按钮元素设置计数器交互：点击时数字递增
export function setupCounter(element: HTMLButtonElement) {
  // 计数器当前值
  let counter = 0
  // 更新按钮上显示的计数
  const setCounter = (count: number) => {
    counter = count
    element.innerHTML = `Count is ${counter}`
  }
  // 绑定点击事件：每次点击计数加 1
  element.addEventListener('click', () => setCounter(counter + 1))
  // 初始化为 0
  setCounter(0)
}
