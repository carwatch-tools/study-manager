<script lang="ts">
    export let fileType: string;
    export let widthMm: number = 210;
</script>

<aside class="alert variant-filled-success ml-[10mm] mt-[10mm] print:hidden py-6" style:width={`${widthMm}mm`}>
    <div class="alert-message">
        <p><span class="m-6">&#128190;</span>To get the {fileType} in printable format, use the <b>print feature </b> of your browser.</p>
        <p><span class="m-6">&#9000;&#65039;</span>Press <b>Ctrl+P</b>, or right click and select 'Print'.</p>
        <p><span class="m-6">&#128194;</span>Select <b>'Print to PDF'</b> to download as file to your PC.</p>
        <p><span class="m-6">&#128424;&#65039;</span>Select your printer if your want to <b>print directly</b>.</p>
    </div>
  </aside>
